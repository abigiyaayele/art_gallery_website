import type { DomainDto, OnboardTenantInput, TenantDto } from '@platform/contracts';
import { assertCan, assertPlatformAdmin } from '../../../shared/auth/policy.js';
import type { Actor } from '../../../shared/context.js';
import { ConflictError, DomainError, NotFoundError } from '../../../shared/errors.js';
import type { PasswordHasher, UserRepository } from '../../identity/application/ports.js';
import { assertSlugAllowed, isPlatformHost, normalizeHost, platformSubdomain } from '../domain/tenant.js';
import type { DomainRepository, TenantRepository } from './ports.js';

/** Platform admin creates a tenant, its owner account, its subdomain, profile and site settings. */
export class OnboardTenant {
  constructor(
    private readonly tenants: TenantRepository,
    private readonly domains: DomainRepository,
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly platformDomain: string,
  ) {}

  async execute(actor: Actor | undefined, input: OnboardTenantInput): Promise<TenantDto> {
    assertPlatformAdmin(actor);
    assertSlugAllowed(input.slug);
    if (await this.tenants.findBySlug(input.slug)) throw new ConflictError('That slug is already taken');
    const hostname = platformSubdomain(input.slug, this.platformDomain);
    if (await this.domains.hostnameTaken(hostname)) throw new ConflictError('That subdomain is already taken');

    const existing = await this.users.findByEmail(input.owner.email);
    return this.tenants.onboard({
      name: input.name,
      slug: input.slug,
      themeKey: input.themeKey,
      hostname,
      owner: existing
        ? { existingUserId: existing.id }
        : { email: input.owner.email, name: input.owner.name, passwordHash: await this.hasher.hash(input.owner.password) },
    });
  }
}

export class ListTenants {
  constructor(private readonly tenants: TenantRepository) {}

  async execute(actor: Actor | undefined) {
    assertPlatformAdmin(actor);
    return this.tenants.list();
  }
}

export class SetTenantStatus {
  constructor(
    private readonly tenants: TenantRepository,
    private readonly resolver: TenantResolver,
  ) {}

  async execute(actor: Actor | undefined, tenantId: string, status: TenantDto['status']) {
    assertPlatformAdmin(actor);
    if (!(await this.tenants.findById(tenantId))) throw new NotFoundError('Tenant');
    await this.tenants.setStatus(tenantId, status);
    this.resolver.clear();
  }
}

export class GetCurrentTenant {
  constructor(private readonly tenants: TenantRepository) {}

  async execute(actor: Actor) {
    assertCan(actor, 'workspace:read');
    const tenant = await this.tenants.findById(actor.tenantId);
    if (!tenant) throw new NotFoundError('Workspace');
    return tenant;
  }
}

export class ListDomains {
  constructor(private readonly domains: DomainRepository) {}

  async execute(actor: Actor) {
    assertCan(actor, 'workspace:read');
    return this.domains.listForTenant(actor.tenantId);
  }
}

export class AddDomain {
  constructor(
    private readonly domains: DomainRepository,
    private readonly resolver: TenantResolver,
    private readonly platformDomain: string,
  ) {}

  async execute(actor: Actor, input: { hostname: string; isPrimary: boolean }): Promise<DomainDto> {
    assertCan(actor, 'domains:manage');
    const hostname = normalizeHost(input.hostname);
    if (isPlatformHost(hostname, this.platformDomain)) {
      throw new DomainError('platform_domain', 'Platform subdomains are assigned automatically');
    }
    if (await this.domains.hostnameTaken(hostname)) throw new ConflictError('That domain is already connected');
    const domain = await this.domains.add(actor.tenantId, hostname, input.isPrimary);
    this.resolver.clear();
    return domain;
  }
}

export class RemoveDomain {
  constructor(
    private readonly domains: DomainRepository,
    private readonly resolver: TenantResolver,
  ) {}

  async execute(actor: Actor, domainId: string) {
    assertCan(actor, 'domains:manage');
    const domain = await this.domains.find(actor.tenantId, domainId);
    if (!domain) throw new NotFoundError('Domain');
    if (domain.isPlatformSubdomain) throw new DomainError('platform_domain', 'The platform subdomain cannot be removed');
    await this.domains.remove(actor.tenantId, domainId);
    this.resolver.clear();
  }
}

/** Maps a request's host to a tenant, with a short in-memory cache. */
export class TenantResolver {
  private cache = new Map<string, { tenantId: string | undefined; at: number }>();

  constructor(
    private readonly domains: DomainRepository,
    private readonly ttlMs = 30_000,
  ) {}

  async resolve(host: string | undefined): Promise<string> {
    if (!host) throw new NotFoundError('Site');
    const hostname = normalizeHost(host);
    const hit = this.cache.get(hostname);
    let tenantId = hit && Date.now() - hit.at < this.ttlMs ? hit.tenantId : undefined;
    if (!hit || Date.now() - hit.at >= this.ttlMs) {
      tenantId = await this.domains.findActiveTenantIdByHostname(hostname);
      this.cache.set(hostname, { tenantId, at: Date.now() });
    }
    if (!tenantId) throw new NotFoundError('Site');
    return tenantId;
  }

  clear() {
    this.cache.clear();
  }
}
