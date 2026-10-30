import type { DomainDto, TenantDto } from '@platform/contracts';
import type { Db } from '../../../shared/db/database.js';
import type { DomainRow, TenantRow } from '../../../shared/db/schema.js';
import type { DomainRepository, OnboardData, TenantRepository } from '../application/ports.js';

const toTenant = (r: TenantRow): TenantDto => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  status: r.status,
  aiMonthlyTokenLimit: r.ai_monthly_token_limit,
  createdAt: r.created_at.toISOString(),
});

const toDomain = (r: DomainRow): DomainDto => ({
  id: r.id,
  hostname: r.hostname,
  isPrimary: r.is_primary,
  isPlatformSubdomain: r.is_platform_subdomain,
  createdAt: r.created_at.toISOString(),
});

export class KyselyTenantRepository implements TenantRepository {
  constructor(private readonly db: Db) {}

  onboard(data: OnboardData): Promise<TenantDto> {
    return this.db.transaction().execute(async trx => {
      const tenant = await trx.insertInto('tenants').values({ name: data.name, slug: data.slug }).returningAll().executeTakeFirstOrThrow();

      const userId =
        'existingUserId' in data.owner
          ? data.owner.existingUserId
          : (
              await trx
                .insertInto('users')
                .values({ email: data.owner.email, name: data.owner.name, password_hash: data.owner.passwordHash })
                .returning('id')
                .executeTakeFirstOrThrow()
            ).id;

      await trx.insertInto('memberships').values({ tenant_id: tenant.id, user_id: userId, role: 'owner' }).execute();
      await trx
        .insertInto('domains')
        .values({ tenant_id: tenant.id, hostname: data.hostname, is_primary: true, is_platform_subdomain: true })
        .execute();
      await trx
        .insertInto('artist_profiles')
        .values({ tenant_id: tenant.id, display_name: data.name, social_links: '[]' })
        .execute();
      await trx
        .insertInto('site_settings')
        .values({
          tenant_id: tenant.id,
          theme_key: data.themeKey,
          branding: JSON.stringify({ siteTitle: data.name }),
          navigation: '[]',
          seo: '{}',
          shop: '{}',
        })
        .execute();
      return toTenant(tenant);
    });
  }

  async findById(id: string) {
    const row = await this.db.selectFrom('tenants').selectAll().where('id', '=', id).executeTakeFirst();
    return row && toTenant(row);
  }

  async findBySlug(slug: string) {
    const row = await this.db.selectFrom('tenants').selectAll().where('slug', '=', slug).executeTakeFirst();
    return row && toTenant(row);
  }

  async list() {
    return (await this.db.selectFrom('tenants').selectAll().orderBy('created_at').execute()).map(toTenant);
  }

  async setStatus(id: string, status: TenantDto['status']) {
    await this.db.updateTable('tenants').set({ status, updated_at: new Date() }).where('id', '=', id).execute();
  }
}

export class KyselyDomainRepository implements DomainRepository {
  constructor(private readonly db: Db) {}

  async listForTenant(tenantId: string) {
    const rows = await this.db.selectFrom('domains').selectAll().where('tenant_id', '=', tenantId).orderBy('created_at').execute();
    return rows.map(toDomain);
  }

  add(tenantId: string, hostname: string, isPrimary: boolean) {
    return this.db.transaction().execute(async trx => {
      if (isPrimary) await trx.updateTable('domains').set({ is_primary: false }).where('tenant_id', '=', tenantId).execute();
      const row = await trx
        .insertInto('domains')
        .values({ tenant_id: tenantId, hostname, is_primary: isPrimary })
        .returningAll()
        .executeTakeFirstOrThrow();
      return toDomain(row);
    });
  }

  async find(tenantId: string, domainId: string) {
    const row = await this.db
      .selectFrom('domains')
      .selectAll()
      .where('tenant_id', '=', tenantId)
      .where('id', '=', domainId)
      .executeTakeFirst();
    return row && toDomain(row);
  }

  async remove(tenantId: string, domainId: string) {
    const res = await this.db.deleteFrom('domains').where('tenant_id', '=', tenantId).where('id', '=', domainId).executeTakeFirst();
    return Number(res.numDeletedRows) > 0;
  }

  async hostnameTaken(hostname: string) {
    return !!(await this.db.selectFrom('domains').select('id').where('hostname', '=', hostname).executeTakeFirst());
  }

  async findActiveTenantIdByHostname(hostname: string) {
    const row = await this.db
      .selectFrom('domains as d')
      .innerJoin('tenants as t', 't.id', 'd.tenant_id')
      .select('t.id')
      .where('d.hostname', '=', hostname)
      .where('t.status', '=', 'active')
      .executeTakeFirst();
    return row?.id;
  }
}
