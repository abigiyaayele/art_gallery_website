import type { Config } from './shared/config.js';
import type { Db } from './shared/db/database.js';
import { SessionIssuer } from './modules/identity/application/session-issuer.js';
import * as identity from './modules/identity/application/use-cases.js';
import { Argon2Hasher, JoseAccessTokenService } from './modules/identity/infrastructure/crypto.js';
import {
  KyselyMembershipRepository,
  KyselyRefreshTokenRepository,
  KyselyUserRepository,
} from './modules/identity/infrastructure/repositories.js';
import * as tenancy from './modules/tenancy/application/use-cases.js';
import { KyselyDomainRepository, KyselyTenantRepository } from './modules/tenancy/infrastructure/repositories.js';

/**
 * Composition root: the one place that picks concrete adapters for each port
 * and wires use cases. Tests build the same graph with fakes where needed.
 */
export function buildContainer(config: Config, db: Db) {
  const users = new KyselyUserRepository(db);
  const memberships = new KyselyMembershipRepository(db);
  const refreshTokens = new KyselyRefreshTokenRepository(db);
  const hasher = new Argon2Hasher();
  const tokens = new JoseAccessTokenService(config.JWT_SECRET, config.ACCESS_TOKEN_TTL_SECONDS);
  const issuer = new SessionIssuer(memberships, refreshTokens, tokens, config.ACCESS_TOKEN_TTL_SECONDS, config.REFRESH_TOKEN_TTL_DAYS);

  const tenants = new KyselyTenantRepository(db);
  const domains = new KyselyDomainRepository(db);
  const resolver = new tenancy.TenantResolver(domains);

  return {
    tokens,
    resolver,
    identity: {
      login: new identity.Login(users, hasher, issuer),
      refresh: new identity.RefreshSession(users, refreshTokens, issuer),
      logout: new identity.Logout(refreshTokens),
      switchTenant: new identity.SwitchTenant(users, memberships, issuer),
      me: new identity.GetSessionUser(users, memberships),
      changePassword: new identity.ChangePassword(users, hasher, refreshTokens),
      listMembers: new identity.ListMembers(memberships),
      addMember: new identity.AddMember(users, memberships, hasher),
      removeMember: new identity.RemoveMember(memberships),
    },
    tenancy: {
      onboard: new tenancy.OnboardTenant(tenants, domains, users, hasher, config.PLATFORM_DOMAIN),
      listTenants: new tenancy.ListTenants(tenants),
      setStatus: new tenancy.SetTenantStatus(tenants, resolver),
      current: new tenancy.GetCurrentTenant(tenants),
      listDomains: new tenancy.ListDomains(domains),
      addDomain: new tenancy.AddDomain(domains, resolver, config.PLATFORM_DOMAIN),
      removeDomain: new tenancy.RemoveDomain(domains, resolver),
    },
  };
}

export type Container = ReturnType<typeof buildContainer>;
