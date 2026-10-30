import crypto from 'node:crypto';
import type { ImageVariant } from '@platform/contracts';

/**
 * Builds image URLs. Public pages get plain URLs (served only for published
 * work); the dashboard gets HMAC-signed URLs that expire, so drafts can be
 * previewed in <img> tags without exposing them.
 */
export class AssetUrlSigner {
  private readonly key: Buffer;

  constructor(
    secret: string,
    private readonly baseUrl: string,
    private readonly ttlSeconds = 6 * 3600,
  ) {
    this.key = crypto.createHash('sha256').update(`asset-urls:${secret}`).digest();
  }

  publicUrl(assetId: string, variant: ImageVariant) {
    return `${this.baseUrl}/assets/${assetId}/${variant}`;
  }

  signedUrl(assetId: string, variant: ImageVariant, now = Date.now()) {
    // Round expiry to the hour so URLs stay stable and cacheable between requests.
    const exp = Math.ceil((now / 1000 + this.ttlSeconds) / 3600) * 3600;
    return `${this.publicUrl(assetId, variant)}?exp=${exp}&sig=${this.sign(assetId, variant, exp)}`;
  }

  verify(assetId: string, variant: string, exp: number | undefined, sig: string | undefined, now = Date.now()) {
    if (!exp || !sig || exp * 1000 < now) return false;
    const expected = Buffer.from(this.sign(assetId, variant, exp));
    const given = Buffer.from(sig);
    return expected.length === given.length && crypto.timingSafeEqual(expected, given);
  }

  private sign(assetId: string, variant: string, exp: number) {
    return crypto.createHmac('sha256', this.key).update(`${assetId}:${variant}:${exp}`).digest('base64url');
  }
}
