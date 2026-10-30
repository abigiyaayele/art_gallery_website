import { assertCan } from '../../../shared/auth/policy.js';
import type { Actor } from '../../../shared/context.js';

export interface OverviewData {
  artworks: { draft: number; available: number; sold: number; onSale: number };
  soldThisMonth: { count: number; totals: { currency: string; cents: number }[] };
  revenue30d: { currency: string; cents: number }[];
  orders: { pending: number; toShip: number };
  inquiries: { new: number };
  views: { day: string; views: number }[];
  topPages: { path: string; views: number }[];
  recent: { kind: 'sold' | 'published' | 'order' | 'inquiry'; title: string; at: string }[];
}

export interface AnalyticsRepository {
  recordView(tenantId: string, day: string, path: string): Promise<void>;
  overview(tenantId: string, now: Date): Promise<OverviewData>;
}

/** Counts a page view per day and path; nothing about the visitor is stored. */
export class RecordPageView {
  constructor(private readonly repo: AnalyticsRepository) {}

  async execute(tenantId: string, path: string, now = new Date()) {
    const clean = path.split('?')[0]!.slice(0, 200) || '/';
    await this.repo.recordView(tenantId, now.toISOString().slice(0, 10), clean);
  }
}

export class GetOverview {
  constructor(private readonly repo: AnalyticsRepository) {}

  async execute(actor: Actor, now = new Date()) {
    assertCan(actor, 'workspace:read');
    return this.repo.overview(actor.tenantId, now);
  }
}
