import type { DomainDto, TenantDto } from '@platform/contracts';

export interface OnboardData {
  name: string;
  slug: string;
  themeKey: string;
  hostname: string;
  owner: { existingUserId: string } | { email: string; name: string; passwordHash: string };
}

export interface TenantRepository {
  onboard(data: OnboardData): Promise<TenantDto>;
  findById(id: string): Promise<TenantDto | undefined>;
  findBySlug(slug: string): Promise<TenantDto | undefined>;
  list(): Promise<TenantDto[]>;
  setStatus(id: string, status: TenantDto['status']): Promise<void>;
}

export interface DomainRepository {
  listForTenant(tenantId: string): Promise<DomainDto[]>;
  add(tenantId: string, hostname: string, isPrimary: boolean): Promise<DomainDto>;
  remove(tenantId: string, domainId: string): Promise<boolean>;
  find(tenantId: string, domainId: string): Promise<DomainDto | undefined>;
  hostnameTaken(hostname: string): Promise<boolean>;
  /** Returns the active tenant serving this hostname, if any. */
  findActiveTenantIdByHostname(hostname: string): Promise<string | undefined>;
}
