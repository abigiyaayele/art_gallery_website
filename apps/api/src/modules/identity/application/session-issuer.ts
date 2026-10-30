import crypto from 'node:crypto';
import type { Session } from '@platform/contracts';
import type { AccessTokenService, MembershipRepository, RefreshTokenRepository, UserRecord } from './ports.js';

export interface IssuedSession {
  session: Session;
  refreshToken: string;
  refreshExpiresAt: Date;
}

export const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

/** Builds a session (access token, refresh token, workspace list) for a user bound to one tenant. */
export class SessionIssuer {
  constructor(
    private readonly memberships: MembershipRepository,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly tokens: AccessTokenService,
    private readonly accessTtlSeconds: number,
    private readonly refreshTtlDays: number,
  ) {}

  async issue(user: UserRecord, requestedTenantId?: string | null): Promise<IssuedSession> {
    const workspaces = await this.memberships.listWorkspaces(user.id);
    const active =
      workspaces.find(w => w.tenantId === requestedTenantId) ?? (requestedTenantId ? undefined : workspaces[0]);
    const tenantId = active?.tenantId ?? null;

    const accessToken = await this.tokens.sign({
      userId: user.id,
      tenantId,
      role: active?.role ?? null,
      isPlatformAdmin: user.isPlatformAdmin,
    });

    const refreshToken = crypto.randomBytes(32).toString('base64url');
    const refreshExpiresAt = new Date(Date.now() + this.refreshTtlDays * 864e5);
    await this.refreshTokens.create({ userId: user.id, tenantId, tokenHash: hashToken(refreshToken), expiresAt: refreshExpiresAt });

    return {
      session: {
        accessToken,
        expiresIn: this.accessTtlSeconds,
        user: { id: user.id, email: user.email, name: user.name, isPlatformAdmin: user.isPlatformAdmin },
        activeTenantId: tenantId,
        workspaces,
      },
      refreshToken,
      refreshExpiresAt,
    };
  }
}
