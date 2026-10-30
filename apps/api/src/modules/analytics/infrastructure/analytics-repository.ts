import { sql } from 'kysely';
import type { Db } from '../../../shared/db/database.js';
import type { AnalyticsRepository, OverviewData } from '../application/use-cases.js';

export class KyselyAnalyticsRepository implements AnalyticsRepository {
  constructor(private readonly db: Db) {}

  async recordView(tenantId: string, day: string, path: string) {
    await this.db
      .insertInto('page_views')
      .values({ tenant_id: tenantId, day, path, views: 1 })
      .onConflict(oc => oc.columns(['tenant_id', 'day', 'path']).doUpdateSet({ views: sql`page_views.views + 1` }))
      .execute();
  }

  async overview(tenantId: string, now: Date): Promise<OverviewData> {
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const since30 = new Date(now.getTime() - 30 * 864e5);
    const since14 = new Date(now.getTime() - 13 * 864e5).toISOString().slice(0, 10);
    const effective = sql<number>`CASE
      WHEN discount_type = 'percent' THEN round(price_cents * (100 - discount_value) / 100.0)
      WHEN discount_type = 'fixed_price' THEN discount_value
      ELSE price_cents END`;

    const [counts, soldMonth, revenue, orders, inquiries, views, topPages, recentArt, recentOrders, recentInquiries] = await Promise.all([
      this.db
        .selectFrom('artworks')
        .select([
          sql<number>`count(*) FILTER (WHERE status = 'draft')::int`.as('draft'),
          sql<number>`count(*) FILTER (WHERE status = 'available')::int`.as('available'),
          sql<number>`count(*) FILTER (WHERE status = 'sold')::int`.as('sold'),
          sql<number>`count(*) FILTER (WHERE status = 'available' AND discount_type IS NOT NULL)::int`.as('onSale'),
        ])
        .where('tenant_id', '=', tenantId)
        .executeTakeFirstOrThrow(),
      this.db
        .selectFrom('artworks')
        .select(['currency', sql<number>`count(*)::int`.as('count'), sql<number>`coalesce(sum(${effective}), 0)::int`.as('cents')])
        .where('tenant_id', '=', tenantId)
        .where('status', '=', 'sold')
        .where('sold_at', '>=', monthStart)
        .groupBy('currency')
        .execute(),
      this.db
        .selectFrom('orders')
        .select(['currency', sql<number>`sum(amount_cents)::int`.as('cents')])
        .where('tenant_id', '=', tenantId)
        .where('status', 'in', ['paid', 'shipped'])
        .where('paid_at', '>=', since30)
        .groupBy('currency')
        .execute(),
      this.db
        .selectFrom('orders')
        .select([
          sql<number>`count(*) FILTER (WHERE status = 'pending')::int`.as('pending'),
          sql<number>`count(*) FILTER (WHERE status = 'paid' AND kind = 'artwork')::int`.as('toShip'),
        ])
        .where('tenant_id', '=', tenantId)
        .executeTakeFirstOrThrow(),
      this.db
        .selectFrom('inquiries')
        .select(sql<number>`count(*)::int`.as('n'))
        .where('tenant_id', '=', tenantId)
        .where('status', '=', 'new')
        .executeTakeFirstOrThrow(),
      this.db
        .selectFrom('page_views')
        .select([sql<string>`to_char(day, 'YYYY-MM-DD')`.as('day'), sql<number>`sum(views)::int`.as('views')])
        .where('tenant_id', '=', tenantId)
        .where('day', '>=', since14)
        .groupBy('day')
        .orderBy('day')
        .execute(),
      this.db
        .selectFrom('page_views')
        .select(['path', sql<number>`sum(views)::int`.as('views')])
        .where('tenant_id', '=', tenantId)
        .where('day', '>=', since14)
        .groupBy('path')
        .orderBy('views', 'desc')
        .limit(5)
        .execute(),
      this.db
        .selectFrom('artworks')
        .select(['title', 'status', 'sold_at', 'published_at'])
        .where('tenant_id', '=', tenantId)
        .where('status', '!=', 'draft')
        .orderBy('updated_at', 'desc')
        .limit(5)
        .execute(),
      this.db.selectFrom('orders').select(['artwork_title', 'kind', 'created_at']).where('tenant_id', '=', tenantId).where('status', 'in', ['paid', 'shipped']).orderBy('created_at', 'desc').limit(5).execute(),
      this.db.selectFrom('inquiries').select(['name', 'kind', 'created_at']).where('tenant_id', '=', tenantId).orderBy('created_at', 'desc').limit(5).execute(),
    ]);

    // Fill missing days so the chart shows a continuous 14-day line.
    const byDay = new Map(views.map(v => [v.day, v.views]));
    const days = Array.from({ length: 14 }, (_, i) => new Date(now.getTime() - (13 - i) * 864e5).toISOString().slice(0, 10));

    const recent: OverviewData['recent'] = [
      ...recentArt.map(a =>
        a.status === 'sold'
          ? { kind: 'sold' as const, title: a.title, at: (a.sold_at ?? a.published_at ?? now).toISOString() }
          : { kind: 'published' as const, title: a.title, at: (a.published_at ?? now).toISOString() },
      ),
      ...recentOrders.map(o => ({ kind: 'order' as const, title: o.kind === 'deposit' ? 'Commission deposit' : o.artwork_title, at: o.created_at.toISOString() })),
      ...recentInquiries.map(i => ({ kind: 'inquiry' as const, title: `${i.name} (${i.kind})`, at: i.created_at.toISOString() })),
    ]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 8);

    return {
      artworks: counts,
      soldThisMonth: {
        count: soldMonth.reduce((n, r) => n + r.count, 0),
        totals: soldMonth.map(r => ({ currency: r.currency, cents: r.cents })),
      },
      revenue30d: revenue.map(r => ({ currency: r.currency, cents: r.cents })),
      orders,
      inquiries: { new: inquiries.n },
      views: days.map(day => ({ day, views: byDay.get(day) ?? 0 })),
      topPages,
      recent,
    };
  }
}
