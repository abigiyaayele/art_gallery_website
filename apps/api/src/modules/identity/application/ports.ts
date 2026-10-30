import type { Member, Role, WorkspaceSummary } from '@platform/contracts';

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  isPlatformAdmin: boolean;
}

export interface UserRepository {
  findByEmail(email: string): Promise<UserRecord | undefined>;
  findById(id: string): Promise<UserRecord | undefined>;
  create(user: Omit<UserRecord, 'id'>): Promise<UserRecord>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
}

export interface MembershipRepository {
  listWorkspaces(userId: string): Promise<WorkspaceSummary[]>;
  findRole(tenantId: string, userId: string): Promise<Role | undefined>;
  listMembers(tenantId: string): Promise<Member[]>;
  add(tenantId: string, userId: string, role: Role): Promise<void>;
  remove(tenantId: string, userId: string): Promise<void>;
  countOwners(tenantId: string): Promise<number>;
}

export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tenantId: string | null;
  expiresAt: Date;
}

export interface RefreshTokenRepository {
  create(input: { userId: string; tenantId: string | null; tokenHash: string; expiresAt: Date }): Promise<void>;
  findActive(tokenHash: string): Promise<RefreshTokenRecord | undefined>;
  revoke(id: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
}

export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(hash: string, plain: string): Promise<boolean>;
}

export interface AccessClaims {
  userId: string;
  tenantId: string | null;
  role: Role | null;
  isPlatformAdmin: boolean;
}

export interface AccessTokenService {
  sign(claims: AccessClaims): Promise<string>;
  verify(token: string): Promise<AccessClaims | undefined>;
}
