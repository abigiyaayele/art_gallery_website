import type { AiSuggestionDto, GoalDto, GoalInput, JournalEntryDto } from '@platform/contracts';
import { sql } from 'kysely';
import type { Db } from '../../../shared/db/database.js';
import type { AiUsageStore, ArtistContextSource, ArtistSnapshot, GoalRepository, JournalRepository, SuggestionRepository } from '../application/ports.js';

export class KyselyAiUsageStore implements AiUsageStore {
  constructor(private readonly db: Db) {}

  async used(tenantId: string, month: string) {
    const row = await this.db
      .selectFrom('ai_usage')
      .select(sql<number>`input_tokens + output_tokens`.as('total'))
      .where('tenant_id', '=', tenantId)
      .where('month', '=', month)
      .executeTakeFirst();
    return row?.total ?? 0;
  }

  async add(tenantId: string, month: string, usage: { inputTokens: number; outputTokens: number }) {
    await this.db
      .insertInto('ai_usage')
      .values({ tenant_id: tenantId, month, input_tokens: usage.inputTokens, output_tokens: usage.outputTokens, requests: 1 })
      .onConflict(oc =>
        oc.columns(['tenant_id', 'month']).doUpdateSet({
          input_tokens: sql`ai_usage.input_tokens + ${usage.inputTokens}`,
          output_tokens: sql`ai_usage.output_tokens + ${usage.outputTokens}`,
          requests: sql`ai_usage.requests + 1`,
        }),
      )
      .execute();
  }

  async limit(tenantId: string) {
    const row = await this.db.selectFrom('tenants').select('ai_monthly_token_limit').where('id', '=', tenantId).executeTakeFirst();
    return row?.ai_monthly_token_limit ?? 0;
  }
}

type SuggestionRow = { id: string; kind: AiSuggestionDto['kind']; artwork_id: string | null; status: AiSuggestionDto['status']; output: unknown; created_at: Date };
const toSuggestion = (r: SuggestionRow): AiSuggestionDto => ({
  id: r.id,
  kind: r.kind,
  artworkId: r.artwork_id,
  status: r.status,
  output: r.output as AiSuggestionDto['output'],
  createdAt: r.created_at.toISOString(),
});

export class KyselySuggestionRepository implements SuggestionRepository {
  constructor(private readonly db: Db) {}

  async create(s: Parameters<SuggestionRepository['create']>[0]) {
    const row = await this.db
      .insertInto('ai_suggestions')
      .values({ tenant_id: s.tenantId, artwork_id: s.artworkId, kind: s.kind, input: JSON.stringify(s.input), output: JSON.stringify(s.output), created_by: s.createdBy })
      .returning(['id', 'kind', 'artwork_id', 'status', 'output', 'created_at'])
      .executeTakeFirstOrThrow();
    return toSuggestion(row);
  }

  async find(tenantId: string, id: string) {
    const row = await this.db
      .selectFrom('ai_suggestions')
      .select(['id', 'kind', 'artwork_id', 'status', 'output', 'created_at'])
      .where('tenant_id', '=', tenantId)
      .where('id', '=', id)
      .executeTakeFirst();
    return row && toSuggestion(row);
  }

  async list(tenantId: string, filter: { artworkId?: string; kind?: AiSuggestionDto['kind'] }) {
    let q = this.db.selectFrom('ai_suggestions').select(['id', 'kind', 'artwork_id', 'status', 'output', 'created_at']).where('tenant_id', '=', tenantId);
    if (filter.artworkId) q = q.where('artwork_id', '=', filter.artworkId);
    if (filter.kind) q = q.where('kind', '=', filter.kind);
    return (await q.orderBy('created_at', 'desc').limit(30).execute()).map(toSuggestion);
  }

  async setStatus(tenantId: string, id: string, status: AiSuggestionDto['status']) {
    await this.db.updateTable('ai_suggestions').set({ status }).where('tenant_id', '=', tenantId).where('id', '=', id).execute();
  }
}

const goalColumns = ['id', 'title', 'notes', 'target', 'current', 'unit', 'status', 'created_at', sql<string | null>`to_char(due_date, 'YYYY-MM-DD')`.as('due')] as const;
type GoalRow = { id: string; title: string; notes: string; target: number | null; current: number; unit: string; status: GoalDto['status']; created_at: Date; due: string | null };
const toGoal = (r: GoalRow): GoalDto => ({
  id: r.id,
  title: r.title,
  notes: r.notes,
  target: r.target,
  current: r.current,
  unit: r.unit,
  dueDate: r.due,
  status: r.status,
  createdAt: r.created_at.toISOString(),
});
const goalValues = (g: GoalInput) => ({ title: g.title, notes: g.notes, target: g.target, current: g.current, unit: g.unit, due_date: g.dueDate, status: g.status });

export class KyselyGoalRepository implements GoalRepository {
  constructor(private readonly db: Db) {}

  async list(tenantId: string) {
    const rows = await this.db.selectFrom('goals').select(goalColumns).where('tenant_id', '=', tenantId).orderBy('created_at', 'desc').execute();
    return rows.map(toGoal);
  }

  async create(tenantId: string, g: GoalInput) {
    return toGoal(await this.db.insertInto('goals').values({ tenant_id: tenantId, ...goalValues(g) }).returning(goalColumns).executeTakeFirstOrThrow());
  }

  async update(tenantId: string, id: string, g: GoalInput) {
    const row = await this.db
      .updateTable('goals')
      .set({ ...goalValues(g), updated_at: new Date() })
      .where('tenant_id', '=', tenantId)
      .where('id', '=', id)
      .returning(goalColumns)
      .executeTakeFirst();
    return row && toGoal(row);
  }

  async delete(tenantId: string, id: string) {
    const r = await this.db.deleteFrom('goals').where('tenant_id', '=', tenantId).where('id', '=', id).executeTakeFirst();
    return r.numDeletedRows > 0n;
  }
}

export class KyselyJournalRepository implements JournalRepository {
  constructor(private readonly db: Db) {}

  async list(tenantId: string, since?: Date) {
    let q = this.db.selectFrom('journal_entries').selectAll().where('tenant_id', '=', tenantId);
    if (since) q = q.where('created_at', '>=', since);
    const rows = await q.orderBy('created_at', 'desc').limit(200).execute();
    return rows.map((r): JournalEntryDto => ({ id: r.id, kind: r.kind, body: r.body, createdAt: r.created_at.toISOString() }));
  }

  async create(tenantId: string, kind: JournalEntryDto['kind'], body: string) {
    const r = await this.db.insertInto('journal_entries').values({ tenant_id: tenantId, kind, body }).returningAll().executeTakeFirstOrThrow();
    return { id: r.id, kind: r.kind, body: r.body, createdAt: r.created_at.toISOString() };
  }

  async delete(tenantId: string, id: string) {
    const r = await this.db.deleteFrom('journal_entries').where('tenant_id', '=', tenantId).where('id', '=', id).executeTakeFirst();
    return r.numDeletedRows > 0n;
  }
}

/** Reads the facts the assistant is briefed with, always scoped to one tenant. */
export class KyselyArtistContext implements ArtistContextSource {
  constructor(private readonly db: Db) {}

  async snapshot(tenantId: string): Promise<ArtistSnapshot> {
    const since90 = new Date(Date.now() - 90 * 86_400_000);
    const since30 = new Date(Date.now() - 30 * 86_400_000);
    const [profile, tenant, counts, collections, recent, sold, inquiries] = await Promise.all([
      this.db.selectFrom('artist_profiles').select(['display_name', 'tagline', 'bio', 'location']).where('tenant_id', '=', tenantId).executeTakeFirst(),
      this.db.selectFrom('tenants').select('name').where('id', '=', tenantId).executeTakeFirstOrThrow(),
      this.db.selectFrom('artworks').select(['status', sql<number>`count(*)::int`.as('n')]).where('tenant_id', '=', tenantId).groupBy('status').execute(),
      this.db
        .selectFrom('artworks')
        .select([
          'collection',
          sql<number>`count(*) filter (where status = 'available')::int`.as('available'),
          sql<number>`count(*) filter (where status = 'sold')::int`.as('sold'),
        ])
        .where('tenant_id', '=', tenantId)
        .where('collection', '<>', '')
        .groupBy('collection')
        .orderBy(sql`count(*)`, 'desc')
        .limit(12)
        .execute(),
      this.db
        .selectFrom('artworks')
        .select(['title', 'collection', 'medium', 'status', 'price_cents', 'currency'])
        .where('tenant_id', '=', tenantId)
        .orderBy('updated_at', 'desc')
        .limit(15)
        .execute(),
      this.db
        .selectFrom('artworks')
        .select(['title', 'collection', 'sold_at'])
        .where('tenant_id', '=', tenantId)
        .where('status', '=', 'sold')
        .where('sold_at', '>=', since90)
        .orderBy('sold_at', 'desc')
        .limit(20)
        .execute(),
      this.db.selectFrom('inquiries').select(sql<number>`count(*)::int`.as('n')).where('tenant_id', '=', tenantId).where('created_at', '>=', since30).executeTakeFirst(),
    ]);
    const count = (s: string) => counts.find(c => c.status === s)?.n ?? 0;
    return {
      name: profile?.display_name || tenant.name,
      tagline: profile?.tagline ?? '',
      bio: profile?.bio ?? '',
      location: profile?.location ?? '',
      counts: { draft: count('draft'), available: count('available'), sold: count('sold') },
      collections: collections.map(c => ({ name: c.collection, available: c.available, sold: c.sold })),
      recentWorks: recent.map(w => ({ title: w.title, collection: w.collection, medium: w.medium, status: w.status, priceCents: w.price_cents, currency: w.currency })),
      soldLast90Days: sold.map(w => ({ title: w.title, collection: w.collection, soldAt: w.sold_at?.toISOString() ?? '' })),
      inquiriesLast30Days: inquiries?.n ?? 0,
    };
  }
}
