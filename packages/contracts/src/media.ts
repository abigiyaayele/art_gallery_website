import { z } from 'zod';

export const imageVariants = ['thumb', 'medium', 'large'] as const;
export type ImageVariant = (typeof imageVariants)[number];

export interface AssetDto {
  id: string;
  kind: 'artwork' | 'site';
  status: 'processing' | 'ready' | 'failed';
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  altText: string;
  /** Present once the asset is ready. Dashboard URLs are signed and expire. */
  urls: Partial<Record<ImageVariant, string>>;
  createdAt: string;
}

export const updateAssetInput = z.object({ altText: z.string().max(300) });
