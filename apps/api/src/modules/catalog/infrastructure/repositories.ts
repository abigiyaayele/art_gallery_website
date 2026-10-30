import crypto from 'node:crypto';
import type { ArtworkListQuery, CategoryDto } from '@platform/contracts';
import type { Db } from '../../../shared/db/database.js';
import type { ArtworkRow, CategoryRow } from '../../../shared/db/schema.js';
import { Artwork } from '../domain/artwork.js';
import type { ArtworkRepository, CategoryRepository } from '../application/ports.js';

const toArtwork = (r: ArtworkRow, imageIds: string[]) =>
  Artwork.restore({
    id: r.id,
    tenantId: r.tenant_id,
    title: r.title,
    slug: r.slug,
    description: r.description,
    story: r.story,
    medium: r.medium,
    dimensions: r.dimensions,
    year: r.year,
    collection: r.collection,
    categoryId: r.category_id,
    tags: r.tags,
    seoTitle: r.seo_title,
    seoDescription: r.seo_description,
    priceCents: r.price_cents,
    currency: r.currency,
    discount: r.discount_type && r.discount_value !== null ? { type: r.discount_type, value: r.discount_value } : null,
    status: r.status,
    featured: r.featured,
    imageIds,
    publishedAt: r.published_at,
    soldAt: r.sold_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  });

/** Every query filters by tenant_id; there is no way to read across tenants from here. */
export class KyselyArtworkRepository implements ArtworkRepository {
  constructor(private readonly db: Db) {}

  newId() {
    return crypto.randomUUID();
  }

  private async withImages(tenantId: string, rows: ArtworkRow[]) {
    if (rows.length === 0) return [];
    const links = await this.db
      .selectFrom('artwork_images')
      .select(['artwork_id', 'asset_id'])
      .where('tenant_id', '=', tenantId)
      .where('artwork_id', 'in', rows.map(r => r.id))
      .orderBy('position')
      .execute();
    return rows.map(r => toArtwork(r, links.filter(l => l.artwork_id === r.id).map(l => l.asset_id)));
  }

  async find(tenantId: string, id: string) {
    const row = await this.db.selectFrom('artworks').selectAll().where('tenant_id', '=', tenantId).where('id', '=', id).executeTakeFirst();
    return row ? (await this.withImages(tenantId, [row]))[0] : undefined;
  }

  async findMany(tenantId: string, ids: string[]) {
    if (ids.length === 0) return [];
    const rows = await this.db.selectFrom('artworks').selectAll().where('tenant_id', '=', tenantId).where('id', 'in', ids).execute();
    return this.withImages(tenantId, rows);
  }

  async findPublicBySlug(tenantId: string, slug: string) {
    const row = await this.db
      .selectFrom('artworks')
      .selectAll()
      .where('tenant_id', '=', tenantId)
      .where('slug', '=', slug)
      .where('status', '!=', 'draft')
      .executeTakeFirst();
    return row ? (await this.withImages(tenantId, [row]))[0] : undefined;
  }

  async list(tenantId: string, q: ArtworkListQuery & { publicOnly?: boolean; categorySlug?: string }) {
    let query = this.db.selectFrom('artworks as a').where('a.tenant_id', '=', tenantId);
    if (q.publicOnly) query = query.where('a.status', '!=', 'draft');
    if (q.status) query = query.where('a.status', '=', q.status);
    if (q.categoryId) query = query.where('a.category_id', '=', q.categoryId);
    if (q.categorySlug) {
      query = query.where('a.category_id', 'in', eb =>
        eb.selectFrom('categories').select('id').where('tenant_id', '=', tenantId).where('slug', '=', q.categorySlug!),
      );
    }
    if (q.onSale) query = query.where('a.discount_type', 'is not', null).where('a.status', '=', 'available');
    if (q.q) query = query.where('a.title', 'ilike', `%${q.q.replace(/[%_]/g, m => `\\${m}`)}%`);

    const { total } = await query.select(eb => eb.fn.countAll<string>().as('total')).executeTakeFirstOrThrow();
    const rows = await query
      .selectAll('a')
      .orderBy('a.featured', 'desc')
      .orderBy('a.sort_order')
      .orderBy('a.created_at', 'desc')
      .limit(q.limit)
      .offset(q.offset)
      .execute();
    return { items: await this.withImages(tenantId, rows), total: Number(total) };
  }

  async slugTaken(tenantId: string, slug: string, exceptId?: string) {
    let q = this.db.selectFrom('artworks').select('id').where('tenant_id', '=', tenantId).where('slug', '=', slug);
    if (exceptId) q = q.where('id', '!=', exceptId);
    return !!(await q.executeTakeFirst());
  }

  async save(artwork: Artwork) {
    const p = artwork.snapshot;
    const values = {
      tenant_id: p.tenantId,
      category_id: p.categoryId,
      title: p.title,
      slug: p.slug,
      description: p.description,
      story: p.story,
      medium: p.medium,
      dimensions: p.dimensions,
      year: p.year,
      collection: p.collection,
      tags: p.tags,
      seo_title: p.seoTitle,
      seo_description: p.seoDescription,
      price_cents: p.priceCents,
      currency: p.currency,
      discount_type: p.discount?.type ?? null,
      discount_value: p.discount?.value ?? null,
      status: p.status,
      featured: p.featured,
      published_at: p.publishedAt,
      sold_at: p.soldAt,
      updated_at: p.updatedAt,
    };
    await this.db.transaction().execute(async trx => {
      await trx
        .insertInto('artworks')
        .values({ id: p.id, created_at: p.createdAt, ...values })
        .onConflict(oc => oc.column('id').doUpdateSet(values).where('artworks.tenant_id', '=', p.tenantId))
        .execute();
      await trx.deleteFrom('artwork_images').where('tenant_id', '=', p.tenantId).where('artwork_id', '=', p.id).execute();
      if (p.imageIds.length) {
        await trx
          .insertInto('artwork_images')
          .values(p.imageIds.map((assetId, position) => ({ tenant_id: p.tenantId, artwork_id: p.id, asset_id: assetId, position })))
          .execute();
      }
    });
  }

  async delete(tenantId: string, id: string) {
    await this.db.deleteFrom('artworks').where('tenant_id', '=', tenantId).where('id', '=', id).execute();
  }
}

const toCategory = (r: CategoryRow): CategoryDto => ({ id: r.id, name: r.name, slug: r.slug, sortOrder: r.sort_order });

export class KyselyCategoryRepository implements CategoryRepository {
  constructor(private readonly db: Db) {}

  async list(tenantId: string) {
    const rows = await this.db.selectFrom('categories').selectAll().where('tenant_id', '=', tenantId).orderBy('sort_order').orderBy('name').execute();
    return rows.map(toCategory);
  }

  async find(tenantId: string, id: string) {
    const row = await this.db.selectFrom('categories').selectAll().where('tenant_id', '=', tenantId).where('id', '=', id).executeTakeFirst();
    return row && toCategory(row);
  }

  async slugTaken(tenantId: string, slug: string, exceptId?: string) {
    let q = this.db.selectFrom('categories').select('id').where('tenant_id', '=', tenantId).where('slug', '=', slug);
    if (exceptId) q = q.where('id', '!=', exceptId);
    return !!(await q.executeTakeFirst());
  }

  async create(tenantId: string, c: Omit<CategoryDto, 'id'>) {
    const row = await this.db
      .insertInto('categories')
      .values({ tenant_id: tenantId, name: c.name, slug: c.slug, sort_order: c.sortOrder })
      .returningAll()
      .executeTakeFirstOrThrow();
    return toCategory(row);
  }

  async update(tenantId: string, id: string, c: Omit<CategoryDto, 'id'>) {
    const row = await this.db
      .updateTable('categories')
      .set({ name: c.name, slug: c.slug, sort_order: c.sortOrder })
      .where('tenant_id', '=', tenantId)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
    return toCategory(row);
  }

  async delete(tenantId: string, id: string) {
    await this.db.deleteFrom('categories').where('tenant_id', '=', tenantId).where('id', '=', id).execute();
  }
}

/** Tells the media module whether an image may be shown publicly or deleted. */
export class CatalogAssetVisibility {
  constructor(private readonly db: Db) {}

  async isPublicArtworkImage(assetId: string) {
    const row = await this.db
      .selectFrom('artwork_images as ai')
      .innerJoin('artworks as a', 'a.id', 'ai.artwork_id')
      .select('a.id')
      .where('ai.asset_id', '=', assetId)
      .where('a.status', '!=', 'draft')
      .executeTakeFirst();
    return !!row;
  }

  async isUsedByArtwork(tenantId: string, assetId: string) {
    const row = await this.db
      .selectFrom('artwork_images')
      .select('artwork_id')
      .where('tenant_id', '=', tenantId)
      .where('asset_id', '=', assetId)
      .executeTakeFirst();
    return !!row;
  }
}
