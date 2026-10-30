import type { InquiryDto } from '@platform/contracts';
import type { Db } from '../../../shared/db/database.js';
import type { ArtworkLookup, InquiryRepository } from '../application/use-cases.js';

export class KyselyInquiryRepository implements InquiryRepository {
  constructor(private readonly db: Db) {}

  async create(tenantId: string, i: Omit<InquiryDto, 'id' | 'status' | 'createdAt'>) {
    await this.db
      .insertInto('inquiries')
      .values({
        tenant_id: tenantId,
        kind: i.kind,
        name: i.name,
        email: i.email,
        phone: i.phone,
        subject: i.subject,
        message: i.message,
        details: JSON.stringify(i.details),
        artwork_id: i.artworkId,
      })
      .execute();
  }

  async list(tenantId: string, status?: InquiryDto['status']) {
    let q = this.db.selectFrom('inquiries').selectAll().where('tenant_id', '=', tenantId);
    if (status) q = q.where('status', '=', status);
    const rows = await q.orderBy('created_at', 'desc').limit(500).execute();
    return rows.map(r => ({
      id: r.id,
      kind: r.kind,
      status: r.status,
      name: r.name,
      email: r.email,
      phone: r.phone,
      subject: r.subject,
      message: r.message,
      details: r.details,
      artworkId: r.artwork_id,
      createdAt: r.created_at.toISOString(),
    }));
  }

  async setStatus(tenantId: string, id: string, status: InquiryDto['status']) {
    const res = await this.db
      .updateTable('inquiries')
      .set({ status, updated_at: new Date() })
      .where('tenant_id', '=', tenantId)
      .where('id', '=', id)
      .executeTakeFirst();
    return Number(res.numUpdatedRows) > 0;
  }
}

export class KyselyArtworkLookup implements ArtworkLookup {
  constructor(private readonly db: Db) {}

  async idForSlug(tenantId: string, slug: string) {
    const row = await this.db.selectFrom('artworks').select('id').where('tenant_id', '=', tenantId).where('slug', '=', slug).executeTakeFirst();
    return row?.id;
  }
}
