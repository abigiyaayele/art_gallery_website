import type { Member, Role, WorkspaceSummary } from '@platform/contracts';
import type { Db } from '../../../shared/db/database.js';
import type { UserRow } from '../../../shared/db/schema.js';
import type {
  MembershipRepository,
  RefreshTokenRecord,
  RefreshTokenRepository,
  UserRecord,
  UserRepository,
} from '../application/ports.js';

const toUser = (row: UserRow): UserRecord => ({
  id: row.id,
  email: row.email,
  name: row.name,
  passwordHash: row.password_hash,
  isPlatformAdmin: row.is_platform_admin,
});

export class KyselyUserRepository implements UserRepository {
  constructor(private readonly db: Db) {}

  async findByEmail(email: string) {
    const row = await this.db.selectFrom('users').selectAll().where('email', '=', email.toLowerCase()).executeTakeFirst();
    return row && toUser(row);
  }

  async findById(id: string) {
    const row = await this.db.selectFrom('users').selectAll().where('id', '=', id).executeTakeFirst();
    return row && toUser(row);
  }

  async create(user: Omit<UserRecord, 'id'>) {
    const row = await this.db
      .insertInto('users')
      .values({ email: user.email.toLowerCase(), name: user.name, password_hash: user.passwordHash, is_platform_admin: user.isPlatformAdmin })
      .returningAll()
      .executeTakeFirstOrThrow();
    return toUser(row);
  }

  async updatePassword(id: string, passwordHash: string) {
    await this.db.updateTable('users').set({ password_hash: passwordHash, updated_at: new Date() }).where('id', '=', id).execute();
  }
}

export class KyselyMembershipRepository implements MembershipRepository {
  constructor(private readonly db: Db) {}

  async listWorkspaces(userId: string): Promise<WorkspaceSummary[]> {
    const rows = await this.db
      .selectFrom('memberships as m')
      .innerJoin('tenants as t', 't.id', 'm.tenant_id')
      .select(['t.id', 't.name', 't.slug', 'm.role'])
      .where('m.user_id', '=', userId)
      .where('t.status', '=', 'active')
      .orderBy('t.name')
      .execute();
    return rows.map(r => ({ tenantId: r.id, tenantName: r.name, tenantSlug: r.slug, role: r.role }));
  }

  async findRole(tenantId: string, userId: string): Promise<Role | undefined> {
    const row = await this.db
      .selectFrom('memberships')
      .select('role')
      .where('tenant_id', '=', tenantId)
      .where('user_id', '=', userId)
      .executeTakeFirst();
    return row?.role;
  }

  async listMembers(tenantId: string): Promise<Member[]> {
    const rows = await this.db
      .selectFrom('memberships as m')
      .innerJoin('users as u', 'u.id', 'm.user_id')
      .select(['u.id', 'u.email', 'u.name', 'm.role', 'm.created_at'])
      .where('m.tenant_id', '=', tenantId)
      .orderBy('m.created_at')
      .execute();
    return rows.map(r => ({ userId: r.id, email: r.email, name: r.name, role: r.role, joinedAt: r.created_at.toISOString() }));
  }

  async add(tenantId: string, userId: string, role: Role) {
    await this.db.insertInto('memberships').values({ tenant_id: tenantId, user_id: userId, role }).execute();
  }

  async remove(tenantId: string, userId: string) {
    await this.db.deleteFrom('memberships').where('tenant_id', '=', tenantId).where('user_id', '=', userId).execute();
  }

  async countOwners(tenantId: string) {
    const row = await this.db
      .selectFrom('memberships')
      .select(eb => eb.fn.countAll<string>().as('n'))
      .where('tenant_id', '=', tenantId)
      .where('role', '=', 'owner')
      .executeTakeFirstOrThrow();
    return Number(row.n);
  }
}

export class KyselyRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly db: Db) {}

  async create(input: { userId: string; tenantId: string | null; tokenHash: string; expiresAt: Date }) {
    await this.db
      .insertInto('refresh_tokens')
      .values({ user_id: input.userId, tenant_id: input.tenantId, token_hash: input.tokenHash, expires_at: input.expiresAt })
      .execute();
  }

  async findActive(tokenHash: string): Promise<RefreshTokenRecord | undefined> {
    const row = await this.db
      .selectFrom('refresh_tokens')
      .select(['id', 'user_id', 'tenant_id', 'expires_at'])
      .where('token_hash', '=', tokenHash)
      .where('revoked_at', 'is', null)
      .where('expires_at', '>', new Date())
      .executeTakeFirst();
    return row && { id: row.id, userId: row.user_id, tenantId: row.tenant_id, expiresAt: row.expires_at };
  }

  async revoke(id: string) {
    await this.db.updateTable('refresh_tokens').set({ revoked_at: new Date() }).where('id', '=', id).execute();
  }

  async revokeAllForUser(userId: string) {
    await this.db
      .updateTable('refresh_tokens')
      .set({ revoked_at: new Date() })
      .where('user_id', '=', userId)
      .where('revoked_at', 'is', null)
      .execute();
  }
}
