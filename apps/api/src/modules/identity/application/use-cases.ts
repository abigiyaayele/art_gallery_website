import type { InviteMemberInput, LoginInput, Member } from '@platform/contracts';
import { assertCan } from '../../../shared/auth/policy.js';
import type { Actor } from '../../../shared/context.js';
import { ConflictError, DomainError, ForbiddenError, NotFoundError, UnauthorizedError } from '../../../shared/errors.js';
import type { MembershipRepository, PasswordHasher, RefreshTokenRepository, UserRepository } from './ports.js';
import { hashToken, type IssuedSession, type SessionIssuer } from './session-issuer.js';

export class Login {
  private dummyHash?: Promise<string>;

  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly issuer: SessionIssuer,
  ) {}

  async execute(input: LoginInput): Promise<IssuedSession> {
    const user = await this.users.findByEmail(input.email);
    if (!user) {
      // Spend the same time as a real check so response timing does not reveal which emails exist.
      this.dummyHash ??= this.hasher.hash('timing-equaliser');
      await this.hasher.verify(await this.dummyHash, input.password);
      throw new UnauthorizedError('Email or password is incorrect');
    }
    if (!(await this.hasher.verify(user.passwordHash, input.password))) {
      throw new UnauthorizedError('Email or password is incorrect');
    }
    return this.issuer.issue(user, input.tenantId);
  }
}

export class RefreshSession {
  constructor(
    private readonly users: UserRepository,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly issuer: SessionIssuer,
  ) {}

  /** Rotates the refresh token: the old one stops working as soon as a new one is issued. */
  async execute(refreshToken: string | undefined, tenantId?: string): Promise<IssuedSession> {
    if (!refreshToken) throw new UnauthorizedError();
    const record = await this.refreshTokens.findActive(hashToken(refreshToken));
    if (!record) throw new UnauthorizedError('Your session has expired');
    const user = await this.users.findById(record.userId);
    if (!user) throw new UnauthorizedError();
    await this.refreshTokens.revoke(record.id);
    return this.issuer.issue(user, tenantId ?? record.tenantId);
  }
}

export class Logout {
  constructor(private readonly refreshTokens: RefreshTokenRepository) {}

  async execute(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;
    const record = await this.refreshTokens.findActive(hashToken(refreshToken));
    if (record) await this.refreshTokens.revoke(record.id);
  }
}

export class SwitchTenant {
  constructor(
    private readonly users: UserRepository,
    private readonly memberships: MembershipRepository,
    private readonly issuer: SessionIssuer,
  ) {}

  async execute(actor: Actor, tenantId: string): Promise<IssuedSession> {
    const user = await this.users.findById(actor.userId);
    if (!user) throw new UnauthorizedError();
    const role = await this.memberships.findRole(tenantId, user.id);
    if (!role) throw new ForbiddenError('You are not a member of that workspace');
    return this.issuer.issue(user, tenantId);
  }
}

export class GetSessionUser {
  constructor(
    private readonly users: UserRepository,
    private readonly memberships: MembershipRepository,
  ) {}

  async execute(actor: Actor) {
    const user = await this.users.findById(actor.userId);
    if (!user) throw new UnauthorizedError();
    return {
      user: { id: user.id, email: user.email, name: user.name, isPlatformAdmin: user.isPlatformAdmin },
      activeTenantId: actor.tenantId,
      role: actor.role,
      workspaces: await this.memberships.listWorkspaces(user.id),
    };
  }
}

export class ChangePassword {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly refreshTokens: RefreshTokenRepository,
  ) {}

  async execute(actor: Actor, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.users.findById(actor.userId);
    if (!user || !(await this.hasher.verify(user.passwordHash, currentPassword))) {
      throw new DomainError('wrong_password', 'Current password is incorrect');
    }
    await this.users.updatePassword(user.id, await this.hasher.hash(newPassword));
    // Sign out every other device.
    await this.refreshTokens.revokeAllForUser(user.id);
  }
}

export class ListMembers {
  constructor(private readonly memberships: MembershipRepository) {}

  async execute(actor: Actor): Promise<Member[]> {
    assertCan(actor, 'workspace:read');
    return this.memberships.listMembers(actor.tenantId);
  }
}

export class AddMember {
  constructor(
    private readonly users: UserRepository,
    private readonly memberships: MembershipRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  /** Adds an existing user by email, or creates the account with the given starting password. */
  async execute(actor: Actor, input: InviteMemberInput): Promise<void> {
    assertCan(actor, 'members:manage');
    let user = await this.users.findByEmail(input.email);
    if (!user) {
      user = await this.users.create({
        email: input.email,
        name: input.name,
        passwordHash: await this.hasher.hash(input.password),
        isPlatformAdmin: false,
      });
    }
    if (await this.memberships.findRole(actor.tenantId, user.id)) {
      throw new ConflictError('That person is already a member');
    }
    await this.memberships.add(actor.tenantId, user.id, input.role);
  }
}

export class RemoveMember {
  constructor(private readonly memberships: MembershipRepository) {}

  async execute(actor: Actor, userId: string): Promise<void> {
    assertCan(actor, 'members:manage');
    const role = await this.memberships.findRole(actor.tenantId, userId);
    if (!role) throw new NotFoundError('Member');
    if (role === 'owner' && (await this.memberships.countOwners(actor.tenantId)) <= 1) {
      throw new DomainError('last_owner', 'A workspace needs at least one owner');
    }
    await this.memberships.remove(actor.tenantId, userId);
  }
}
