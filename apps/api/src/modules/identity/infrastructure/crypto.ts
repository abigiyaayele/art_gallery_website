import { hash, verify } from '@node-rs/argon2';
import { SignJWT, jwtVerify } from 'jose';
import type { AccessClaims, AccessTokenService, PasswordHasher } from '../application/ports.js';

export class Argon2Hasher implements PasswordHasher {
  hash(plain: string) {
    return hash(plain);
  }

  async verify(hashed: string, plain: string) {
    try {
      return await verify(hashed, plain);
    } catch {
      return false;
    }
  }
}

export class JoseAccessTokenService implements AccessTokenService {
  private readonly key: Uint8Array;

  constructor(
    secret: string,
    private readonly ttlSeconds: number,
  ) {
    this.key = new TextEncoder().encode(secret);
  }

  sign(claims: AccessClaims) {
    return new SignJWT({ tid: claims.tenantId, role: claims.role, pa: claims.isPlatformAdmin })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(claims.userId)
      .setIssuedAt()
      .setExpirationTime(`${this.ttlSeconds}s`)
      .sign(this.key);
  }

  async verify(token: string): Promise<AccessClaims | undefined> {
    try {
      const { payload } = await jwtVerify(token, this.key, { algorithms: ['HS256'] });
      if (!payload.sub) return undefined;
      return {
        userId: payload.sub,
        tenantId: (payload.tid as string | null) ?? null,
        role: (payload.role as AccessClaims['role']) ?? null,
        isPlatformAdmin: payload.pa === true,
      };
    } catch {
      return undefined;
    }
  }
}
