import type { Db } from '../../../shared/db/database.js';
import type { AssetRow, AssetVariant } from '../../../shared/db/schema.js';
import type { AssetRecord, AssetRepository } from '../application/ports.js';

const toRecord = (r: AssetRow): AssetRecord => ({
  id: r.id,
  tenantId: r.tenant_id,
  kind: r.kind,
  status: r.status,
  originalKey: r.original_key,
  originalName: r.original_name,
  mimeType: r.mime_type,
  sizeBytes: r.size_bytes,
  width: r.width,
  height: r.height,
  variants: r.variants,
  altText: r.alt_text,
  createdAt: r.created_at,
});

export class KyselyAssetRepository implements AssetRepository {
  constructor(private readonly db: Db) {}

  async create(a: Omit<AssetRecord, 'status' | 'width' | 'height' | 'variants' | 'createdAt' | 'altText'>) {
    const row = await this.db
      .insertInto('assets')
      .values({
        id: a.id,
        tenant_id: a.tenantId,
        kind: a.kind,
        original_key: a.originalKey,
        original_name: a.originalName,
        mime_type: a.mimeType,
        size_bytes: a.sizeBytes,
        width: null,
        height: null,
        variants: '{}',
        error: null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return toRecord(row);
  }

  async find(tenantId: string, id: string) {
    const row = await this.db.selectFrom('assets').selectAll().where('tenant_id', '=', tenantId).where('id', '=', id).executeTakeFirst();
    return row && toRecord(row);
  }

  async findAnyTenant(id: string) {
    const row = await this.db.selectFrom('assets').selectAll().where('id', '=', id).executeTakeFirst();
    return row && toRecord(row);
  }

  async findMany(tenantId: string, ids: string[]) {
    if (ids.length === 0) return [];
    const rows = await this.db.selectFrom('assets').selectAll().where('tenant_id', '=', tenantId).where('id', 'in', ids).execute();
    return rows.map(toRecord);
  }

  async list(tenantId: string, kind?: AssetRecord['kind']) {
    let q = this.db.selectFrom('assets').selectAll().where('tenant_id', '=', tenantId);
    if (kind) q = q.where('kind', '=', kind);
    return (await q.orderBy('created_at', 'desc').limit(500).execute()).map(toRecord);
  }

  async markReady(id: string, info: { width: number; height: number; variants: Record<string, AssetVariant> }) {
    await this.db
      .updateTable('assets')
      .set({ status: 'ready', width: info.width, height: info.height, variants: JSON.stringify(info.variants), error: null, updated_at: new Date() })
      .where('id', '=', id)
      .execute();
  }

  async markFailed(id: string, error: string) {
    await this.db.updateTable('assets').set({ status: 'failed', error: error.slice(0, 500), updated_at: new Date() }).where('id', '=', id).execute();
  }

  async updateAlt(tenantId: string, id: string, altText: string) {
    await this.db
      .updateTable('assets')
      .set({ alt_text: altText, updated_at: new Date() })
      .where('tenant_id', '=', tenantId)
      .where('id', '=', id)
      .execute();
  }

  async delete(tenantId: string, id: string) {
    await this.db.deleteFrom('assets').where('tenant_id', '=', tenantId).where('id', '=', id).execute();
  }
}
