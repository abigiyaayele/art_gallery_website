import type { ImageVariant } from '@platform/contracts';
import { ValidationError } from '../../../shared/errors.js';

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

/** Longest edge of each generated variant, in pixels. */
export const VARIANT_SIZES: Record<ImageVariant, number> = { thumb: 400, medium: 1200, large: 2400 };

/** Formats we accept, detected from the file's bytes rather than its name. */
const ACCEPTED: Record<string, { mime: string; ext: string }> = {
  jpeg: { mime: 'image/jpeg', ext: 'jpg' },
  png: { mime: 'image/png', ext: 'png' },
  webp: { mime: 'image/webp', ext: 'webp' },
  avif: { mime: 'image/avif', ext: 'avif' },
  heif: { mime: 'image/avif', ext: 'avif' },
  tiff: { mime: 'image/tiff', ext: 'tiff' },
};

export function acceptedFormat(detected: string | undefined) {
  const format = detected && ACCEPTED[detected];
  if (!format) throw new ValidationError('Upload a JPEG, PNG, WebP, AVIF or TIFF image');
  return format;
}

/** Every key for a tenant starts with its id, so storage stays organised and easy to export or delete per tenant. */
export const assetKeys = {
  original: (tenantId: string, assetId: string, ext: string) => `tenants/${tenantId}/assets/${assetId}/original.${ext}`,
  variant: (tenantId: string, assetId: string, variant: ImageVariant) => `tenants/${tenantId}/assets/${assetId}/${variant}.webp`,
};
