import { z } from 'zod';

const text = (max: number) => z.string().trim().max(max);

export const aiTones = ['warm', 'poetic', 'professional', 'playful', 'concise'] as const;
export type AiTone = (typeof aiTones)[number];

export const describeArtworkInput = z.object({
  tone: z.enum(aiTones).default('warm'),
  /** Anything the artist wants the writer to know: the story, materials, a feeling. */
  notes: text(2000).default(''),
});

/** Draft copy for one artwork. Nothing is saved to the artwork until the artist applies it. */
export interface ArtworkCopy {
  titles: string[];
  description: string;
  story: string;
  tags: string[];
  seoDescription: string;
}

export interface ArtworkIdea {
  title: string;
  concept: string;
  palette: string;
  whyItFits: string;
}

export type AiSuggestionKind = 'artwork_copy' | 'ideas';

export interface AiSuggestionDto {
  id: string;
  kind: AiSuggestionKind;
  artworkId: string | null;
  status: 'pending' | 'applied' | 'dismissed';
  output: ArtworkCopy | { ideas: ArtworkIdea[] };
  createdAt: string;
}

export const applyCopyInput = z
  .object({
    title: text(200).min(1),
    description: text(5000),
    story: text(20000),
    tags: z.array(text(40).min(1)).max(20),
    seoDescription: text(170),
  })
  .partial();
export type ApplyCopyInput = z.infer<typeof applyCopyInput>;

export const ideasInput = z.object({
  theme: text(500).default(''),
  count: z.number().int().min(1).max(8).default(4),
});

export const chatInput = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: text(8000).min(1) }))
    .min(1)
    .max(40)
    .refine(m => m[m.length - 1]!.role === 'user', 'The last message must be from you'),
});
export type ChatInput = z.infer<typeof chatInput>;

export interface AiUsageDto {
  configured: boolean;
  month: string;
  usedTokens: number;
  limitTokens: number;
}

export const goalStatuses = ['active', 'done', 'dropped'] as const;
export const goalInput = z.object({
  title: text(200).min(1),
  notes: text(2000).default(''),
  target: z.number().int().min(1).max(1_000_000).nullable().default(null),
  current: z.number().int().min(0).max(1_000_000).default(0),
  unit: text(40).default(''),
  dueDate: z.string().date().nullable().default(null),
  status: z.enum(goalStatuses).default('active'),
});
export type GoalInput = z.infer<typeof goalInput>;
export interface GoalDto extends GoalInput {
  id: string;
  createdAt: string;
}

export const journalInput = z.object({ body: text(10000).min(1) });
export interface JournalEntryDto {
  id: string;
  kind: 'entry' | 'summary';
  body: string;
  createdAt: string;
}
