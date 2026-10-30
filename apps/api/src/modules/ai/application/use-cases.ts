import type {
  AiSuggestionDto,
  AiTone,
  AiUsageDto,
  ApplyCopyInput,
  ArtworkCopy,
  ArtworkIdea,
  ChatInput,
  GoalInput,
} from '@platform/contracts';
import { assertCan } from '../../../shared/auth/policy.js';
import type { Actor } from '../../../shared/context.js';
import { DomainError, LimitExceededError, NotFoundError } from '../../../shared/errors.js';
import { ASSISTANT_PERSONA, buildArtistContext } from './context.js';
import type {
  AiProvider,
  AiRequest,
  AiUsageStore,
  ArtistContextSource,
  ArtworkAccess,
  GoalRepository,
  JournalRepository,
  SuggestionRepository,
} from './ports.js';

const monthOf = (d: Date) => d.toISOString().slice(0, 7);

/**
 * Every model call goes through here: checks the workspace's monthly token
 * allowance before calling, and records what was spent after.
 */
export class MeteredAi {
  constructor(
    private readonly provider: AiProvider,
    private readonly usage: AiUsageStore,
  ) {}

  async usageFor(tenantId: string, now = new Date()): Promise<AiUsageDto> {
    const month = monthOf(now);
    const [used, limit] = await Promise.all([this.usage.used(tenantId, month), this.usage.limit(tenantId)]);
    return { configured: this.provider.configured, month, usedTokens: used, limitTokens: limit };
  }

  async generate(tenantId: string, req: AiRequest, now = new Date()) {
    if (!this.provider.configured) throw new DomainError('ai_not_configured', 'The AI assistant is not set up on this platform yet.');
    const u = await this.usageFor(tenantId, now);
    if (u.usedTokens >= u.limitTokens) {
      throw new LimitExceededError(`You have used this month's AI allowance (${u.limitTokens.toLocaleString('en-US')} tokens). It resets on the 1st.`);
    }
    const result = await this.provider.generate(req);
    await this.usage.add(tenantId, u.month, result.usage);
    return result.text;
  }

  async generateJson<T>(tenantId: string, req: AiRequest & { schema: Record<string, unknown> }): Promise<T> {
    const text = await this.generate(tenantId, req);
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new DomainError('ai_bad_output', 'The assistant returned something unexpected. Please try again.');
    }
  }
}

interface Deps {
  ai: MeteredAi;
  context: ArtistContextSource;
  artworks: ArtworkAccess;
  suggestions: SuggestionRepository;
  goals: GoalRepository;
  journal: JournalRepository;
}

const str = { type: 'string' } as const;
const strings = { type: 'array', items: str } as const;
const object = (properties: Record<string, unknown>) => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });

const copySchema = object({ titles: strings, description: str, story: str, tags: strings, seoDescription: str });
const ideasSchema = object({ ideas: { type: 'array', items: object({ title: str, concept: str, palette: str, whyItFits: str }) } });

const toneGuide: Record<AiTone, string> = {
  warm: 'warm and inviting, like the artist talking to a visitor in the studio',
  poetic: 'lyrical and evocative, with restraint; no purple prose',
  professional: 'clear and gallery-like, as on a museum wall label',
  playful: 'light and joyful, with a little humour',
  concise: 'short and direct; every word earns its place',
};

async function briefing(d: Deps, tenantId: string) {
  const [snapshot, goals] = await Promise.all([d.context.snapshot(tenantId), d.goals.list(tenantId)]);
  return `${ASSISTANT_PERSONA}\n\n<artist_data>\n${buildArtistContext(snapshot, goals.filter(g => g.status === 'active'))}\n</artist_data>`;
}

/** Drafts titles, description, story and tags for one artwork from its image and details. */
export class DraftArtworkCopy {
  constructor(private readonly d: Deps) {}

  async execute(actor: Actor, artworkId: string, input: { tone: AiTone; notes: string }): Promise<AiSuggestionDto> {
    assertCan(actor, 'ai:use');
    const artwork = await this.d.artworks.get(actor, artworkId);
    const cover = artwork.images[0] && (await this.d.artworks.coverImage(actor.tenantId, artwork.images[0].id));

    const facts = [
      `Current title: ${artwork.title}`,
      artwork.medium && `Medium: ${artwork.medium}`,
      artwork.dimensions && `Size: ${artwork.dimensions}`,
      artwork.year && `Year: ${artwork.year}`,
      artwork.collection && `Collection: ${artwork.collection}`,
      artwork.description && `Existing description: ${artwork.description}`,
      input.notes && `Notes from the artist: ${input.notes}`,
    ].filter(Boolean);

    const output = await this.d.ai.generateJson<ArtworkCopy>(actor.tenantId, {
      system: await briefing(this.d, actor.tenantId),
      effort: 'medium',
      schema: copySchema,
      messages: [
        {
          role: 'user',
          images: cover ? [cover] : [],
          text: `Write website copy for this artwork. Tone: ${toneGuide[input.tone]}.

${facts.join('\n')}

Return:
- titles: 3 title options (the first may keep the current title if it fits)
- description: 2 to 3 sentences on what the viewer sees
- story: one short paragraph on the idea or feeling behind it, in the artist's voice; only use facts given above or visible in the image
- tags: 5 to 8 lowercase tags a collector might search for
- seoDescription: one sentence, at most 160 characters
${cover ? '' : 'There is no image yet, so work from the details only.'}`,
        },
      ],
    });
    return this.d.suggestions.create({ tenantId: actor.tenantId, artworkId, kind: 'artwork_copy', input, output, createdBy: actor.userId });
  }
}

/** The artist picks what to keep from a draft; only then does the artwork change. */
export class ApplyArtworkCopy {
  constructor(private readonly d: Deps) {}

  async execute(actor: Actor, suggestionId: string, choice: ApplyCopyInput) {
    assertCan(actor, 'artwork:write');
    const s = await this.d.suggestions.find(actor.tenantId, suggestionId);
    if (!s || s.kind !== 'artwork_copy' || !s.artworkId) throw new NotFoundError('Suggestion');
    if (s.status !== 'pending') throw new DomainError('suggestion_closed', 'This suggestion was already used or dismissed.');
    const artwork = await this.d.artworks.applyCopy(actor, s.artworkId, choice);
    await this.d.suggestions.setStatus(actor.tenantId, s.id, 'applied');
    return artwork;
  }
}

export class DismissSuggestion {
  constructor(private readonly d: Deps) {}

  async execute(actor: Actor, suggestionId: string) {
    assertCan(actor, 'ai:use');
    if (!(await this.d.suggestions.find(actor.tenantId, suggestionId))) throw new NotFoundError('Suggestion');
    await this.d.suggestions.setStatus(actor.tenantId, suggestionId, 'dismissed');
  }
}

export class ListSuggestions {
  constructor(private readonly d: Deps) {}

  async execute(actor: Actor, filter: { artworkId?: string; kind?: AiSuggestionDto['kind'] }) {
    assertCan(actor, 'ai:use');
    return this.d.suggestions.list(actor.tenantId, filter);
  }
}

/** New work ideas grounded in what the artist makes and what has sold. */
export class GenerateIdeas {
  constructor(private readonly d: Deps) {}

  async execute(actor: Actor, input: { theme: string; count: number }) {
    assertCan(actor, 'ai:use');
    const output = await this.d.ai.generateJson<{ ideas: ArtworkIdea[] }>(actor.tenantId, {
      system: await briefing(this.d, actor.tenantId),
      effort: 'medium',
      schema: ideasSchema,
      messages: [
        {
          role: 'user',
          text: `Suggest ${input.count} ideas for new artworks that fit this artist's style and recent collectors' interest.${input.theme ? ` Theme or constraint: ${input.theme}.` : ''}
For each: a working title, the concept in 2 sentences, a short palette description, and why it fits (refer to their collections or sales).`,
        },
      ],
    });
    return this.d.suggestions.create({ tenantId: actor.tenantId, artworkId: null, kind: 'ideas', input, output: { ideas: output.ideas.slice(0, input.count) }, createdBy: actor.userId });
  }
}

/** Free conversation with the assistant. History lives in the browser; each call is self-contained. */
export class Chat {
  constructor(private readonly d: Deps) {}

  async execute(actor: Actor, input: ChatInput) {
    assertCan(actor, 'ai:use');
    const reply = await this.d.ai.generate(actor.tenantId, {
      system: await briefing(this.d, actor.tenantId),
      effort: 'low',
      maxTokens: 4000,
      messages: input.messages.map(m => ({ role: m.role, text: m.content })),
    });
    return { reply };
  }
}

export class GetAiUsage {
  constructor(private readonly ai: MeteredAi) {}

  async execute(actor: Actor) {
    assertCan(actor, 'workspace:read');
    return this.ai.usageFor(actor.tenantId);
  }
}

// Goals and journal: plain records, plus an AI weekly summary on request.

export class ListGoals {
  constructor(private readonly d: Deps) {}
  async execute(actor: Actor) {
    assertCan(actor, 'workspace:read');
    return this.d.goals.list(actor.tenantId);
  }
}

export class SaveGoal {
  constructor(private readonly d: Deps) {}
  async execute(actor: Actor, id: string | null, input: GoalInput) {
    assertCan(actor, 'artwork:write');
    if (!id) return this.d.goals.create(actor.tenantId, input);
    const goal = await this.d.goals.update(actor.tenantId, id, input);
    if (!goal) throw new NotFoundError('Goal');
    return goal;
  }
}

export class DeleteGoal {
  constructor(private readonly d: Deps) {}
  async execute(actor: Actor, id: string) {
    assertCan(actor, 'artwork:write');
    if (!(await this.d.goals.delete(actor.tenantId, id))) throw new NotFoundError('Goal');
  }
}

export class ListJournal {
  constructor(private readonly d: Deps) {}
  async execute(actor: Actor) {
    assertCan(actor, 'workspace:read');
    return this.d.journal.list(actor.tenantId);
  }
}

export class AddJournalEntry {
  constructor(private readonly d: Deps) {}
  async execute(actor: Actor, body: string) {
    assertCan(actor, 'artwork:write');
    return this.d.journal.create(actor.tenantId, 'entry', body);
  }
}

export class DeleteJournalEntry {
  constructor(private readonly d: Deps) {}
  async execute(actor: Actor, id: string) {
    assertCan(actor, 'artwork:write');
    if (!(await this.d.journal.delete(actor.tenantId, id))) throw new NotFoundError('Journal entry');
  }
}

/** Reads the last week's journal, goals and sales and writes a short encouraging recap into the journal. */
export class WriteWeeklySummary {
  constructor(private readonly d: Deps) {}

  async execute(actor: Actor, now = new Date()) {
    assertCan(actor, 'ai:use');
    const since = new Date(now.getTime() - 7 * 86_400_000);
    const entries = (await this.d.journal.list(actor.tenantId, since)).filter(e => e.kind === 'entry');
    const body = await this.d.ai.generate(actor.tenantId, {
      system: await briefing(this.d, actor.tenantId),
      effort: 'low',
      maxTokens: 2000,
      messages: [
        {
          role: 'user',
          text: `Write my weekly studio summary for the week ending ${now.toISOString().slice(0, 10)}.
My journal this week:
${entries.length ? entries.map(e => `- ${e.createdAt.slice(0, 10)}: ${e.body}`).join('\n') : '(no entries this week)'}

In under 180 words: what I worked on, progress on my goals, anything sold, and one or two concrete suggestions for next week. Plain text, no headings.`,
        },
      ],
    });
    return this.d.journal.create(actor.tenantId, 'summary', body.trim());
  }
}

