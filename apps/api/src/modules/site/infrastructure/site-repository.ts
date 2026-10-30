import { brandingSchema, sitePageInput, type PageSlug, type ProfileInput, type SitePageInput } from '@platform/contracts';
import type { Db } from '../../../shared/db/database.js';
import type { SiteRepository, StoredSettings } from '../application/ports.js';

export class KyselySiteRepository implements SiteRepository {
  constructor(private readonly db: Db) {}

  async getProfile(tenantId: string): Promise<ProfileInput | undefined> {
    const r = await this.db.selectFrom('artist_profiles').selectAll().where('tenant_id', '=', tenantId).executeTakeFirst();
    return (
      r && {
        displayName: r.display_name,
        tagline: r.tagline,
        bio: r.bio,
        statement: r.statement,
        location: r.location,
        email: r.email,
        phone: r.phone,
        address: r.address,
        hours: r.hours,
        socialLinks: r.social_links,
        photoAssetId: r.photo_asset_id,
      }
    );
  }

  async saveProfile(tenantId: string, p: ProfileInput) {
    await this.db
      .updateTable('artist_profiles')
      .set({
        display_name: p.displayName,
        tagline: p.tagline,
        bio: p.bio,
        statement: p.statement,
        location: p.location,
        email: p.email,
        phone: p.phone,
        address: p.address,
        hours: p.hours,
        social_links: JSON.stringify(p.socialLinks),
        photo_asset_id: p.photoAssetId,
        updated_at: new Date(),
      })
      .where('tenant_id', '=', tenantId)
      .execute();
  }

  async getSettings(tenantId: string): Promise<StoredSettings | undefined> {
    const r = await this.db.selectFrom('site_settings').selectAll().where('tenant_id', '=', tenantId).executeTakeFirst();
    if (!r) return undefined;
    // Stored JSON is parsed through the contract so older rows get defaults for new fields.
    return {
      themeKey: r.theme_key as StoredSettings['themeKey'],
      branding: brandingSchema.parse(r.branding),
      seo: { title: String(r.seo.title ?? ''), description: String(r.seo.description ?? '') },
    };
  }

  async saveSettings(tenantId: string, s: StoredSettings) {
    await this.db
      .updateTable('site_settings')
      .set({ theme_key: s.themeKey, branding: JSON.stringify(s.branding), seo: JSON.stringify(s.seo), updated_at: new Date() })
      .where('tenant_id', '=', tenantId)
      .execute();
  }

  async listPages(tenantId: string) {
    const rows = await this.db.selectFrom('site_pages').selectAll().where('tenant_id', '=', tenantId).execute();
    return rows.flatMap(r => {
      const parsed = sitePageInput.safeParse({ title: r.title, enabled: r.enabled, blocks: r.blocks });
      return parsed.success ? [{ slug: r.slug as PageSlug, ...parsed.data }] : [];
    });
  }

  async savePage(tenantId: string, slug: PageSlug, page: SitePageInput) {
    const values = { title: page.title, enabled: page.enabled, blocks: JSON.stringify(page.blocks), updated_at: new Date() };
    await this.db
      .insertInto('site_pages')
      .values({ tenant_id: tenantId, slug, ...values })
      .onConflict(oc => oc.columns(['tenant_id', 'slug']).doUpdateSet(values))
      .execute();
  }

  async tenantInfo(tenantId: string) {
    const row = await this.db
      .selectFrom('tenants as t')
      .leftJoin('domains as d', join => join.onRef('d.tenant_id', '=', 't.id').on('d.is_primary', '=', true))
      .select(['t.name', 't.slug', 'd.hostname'])
      .where('t.id', '=', tenantId)
      .executeTakeFirst();
    return row && { name: row.name, slug: row.slug, primaryHost: row.hostname ?? '' };
  }
}
