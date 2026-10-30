import type { Actor } from '../../../shared/context.js';
import type { ArtworkDto, GoalDto, GoalInput, JournalEntryDto, AiSuggestionDto, AiSuggestionKind } from '@platform/contracts';

export interface AiImage {
  mediaType: 'image/webp' | 'image/jpeg' | 'image/png';
  data: Buffer;
}

export interface AiMessage {
  role: 'user' | 'assistant';
  text: string;
  images?: AiImage[];
}

export interface AiRequest {
  system: string;
  messages: AiMessage[];
  /** JSON schema the reply must follow; the reply text is then that JSON. */
  schema?: Record<string, unknown>;
  effort?: 'low' | 'medium' | 'high';
  maxTokens?: number;
}

export interface AiResult {
  text: string;
  usage: { inputTokens: number; outputTokens: number };
}

/** The language model behind the assistant. Swappable: Claude in production, a fake in tests. */
export interface AiProvider {
  readonly configured: boolean;
  generate(req: AiRequest): Promise<AiResult>;
}

export interface AiUsageStore {
  used(tenantId: string, month: string): Promise<number>;
  add(tenantId: string, month: string, usage: AiResult['usage']): Promise<void>;
  limit(tenantId: string): Promise<number>;
}

export interface SuggestionRepository {
  create(s: { tenantId: string; artworkId: string | null; kind: AiSuggestionKind; input: object; output: object; createdBy: string }): Promise<AiSuggestionDto>;
  find(tenantId: string, id: string): Promise<AiSuggestionDto | undefined>;
  list(tenantId: string, filter: { artworkId?: string; kind?: AiSuggestionKind }): Promise<AiSuggestionDto[]>;
  setStatus(tenantId: string, id: string, status: AiSuggestionDto['status']): Promise<void>;
}

export interface GoalRepository {
  list(tenantId: string): Promise<GoalDto[]>;
  create(tenantId: string, g: GoalInput): Promise<GoalDto>;
  update(tenantId: string, id: string, g: GoalInput): Promise<GoalDto | undefined>;
  delete(tenantId: string, id: string): Promise<boolean>;
}

export interface JournalRepository {
  list(tenantId: string, since?: Date): Promise<JournalEntryDto[]>;
  create(tenantId: string, kind: JournalEntryDto['kind'], body: string): Promise<JournalEntryDto>;
  delete(tenantId: string, id: string): Promise<boolean>;
}

/** What the assistant may know about the artist, read fresh for every request. */
export interface ArtistSnapshot {
  name: string;
  tagline: string;
  bio: string;
  location: string;
  counts: { draft: number; available: number; sold: number };
  collections: { name: string; available: number; sold: number }[];
  recentWorks: { title: string; collection: string; medium: string; status: string; priceCents: number | null; currency: string }[];
  soldLast90Days: { title: string; collection: string; soldAt: string }[];
  inquiriesLast30Days: number;
}

export interface ArtistContextSource {
  snapshot(tenantId: string): Promise<ArtistSnapshot>;
}

/** Narrow window onto the catalog: read an artwork and its cover, write approved copy. */
export interface ArtworkAccess {
  get(actor: Actor, id: string): Promise<ArtworkDto>;
  coverImage(tenantId: string, assetId: string): Promise<AiImage | undefined>;
  applyCopy(actor: Actor, id: string, patch: Partial<Pick<ArtworkDto, 'title' | 'description' | 'story' | 'tags' | 'seoDescription'>>): Promise<ArtworkDto>;
}
