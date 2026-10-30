import { z } from 'zod';
import { slug, uuid } from './common.js';
import type { AssetDto } from './media.js';

export const currencies = ['USD', 'ETB', 'EUR', 'GBP'] as const;
export const currencySchema = z.enum(currencies);

export const artworkStatuses = ['draft', 'available', 'sold'] as const;
export const artworkStatusSchema = z.enum(artworkStatuses);
export type ArtworkStatus = z.infer<typeof artworkStatusSchema>;

export const discountSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('percent'), value: z.number().int().min(1).max(90) }),
  /** A sale price in cents that replaces the regular price. */
  z.object({ type: z.literal('fixed_price'), value: z.number().int().positive() }),
]);
export type Discount = z.infer<typeof discountSchema>;

const text = (max: number) => z.string().trim().max(max);

export const artworkInput = z.object({
  title: text(200).min(1),
  slug: slug.optional(),
  description: text(5000).default(''),
  story: text(20000).default(''),
  medium: text(200).default(''),
  dimensions: text(200).default(''),
  year: z.number().int().min(1000).max(3000).nullable().default(null),
  collection: text(200).default(''),
  categoryId: uuid.nullable().default(null),
  tags: z.array(text(40).min(1)).max(30).default([]),
  seoTitle: text(70).default(''),
  seoDescription: text(170).default(''),
  /** Price in cents; null while the price is not decided. */
  priceCents: z.number().int().positive().nullable().default(null),
  currency: currencySchema.default('USD'),
  discount: discountSchema.nullable().default(null),
  featured: z.boolean().default(false),
  imageIds: z.array(uuid).max(20).default([]),
});
export type ArtworkInput = z.infer<typeof artworkInput>;

export const artworkUpdateInput = artworkInput.partial();
export type ArtworkUpdateInput = z.infer<typeof artworkUpdateInput>;

export const artworkListQuery = z.object({
  status: artworkStatusSchema.optional(),
  categoryId: uuid.optional(),
  onSale: z.coerce.boolean().optional(),
  q: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ArtworkListQuery = z.infer<typeof artworkListQuery>;

export const bulkArtworkInput = z.object({
  ids: z.array(uuid).min(1).max(200),
  action: z.enum(['publish', 'unpublish', 'mark_sold', 'delete', 'clear_discount', 'apply_discount']),
  discount: discountSchema.optional(),
});
export type BulkArtworkInput = z.infer<typeof bulkArtworkInput>;

export const categoryInput = z.object({
  name: text(80).min(1),
  slug: slug.optional(),
  sortOrder: z.number().int().default(0),
});

export interface Price {
  currency: string;
  regularCents: number;
  effectiveCents: number;
  onSale: boolean;
  /** Rounded percentage off the regular price when on sale. */
  percentOff: number | null;
}

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
}

export interface ArtworkDto {
  id: string;
  title: string;
  slug: string;
  description: string;
  story: string;
  medium: string;
  dimensions: string;
  year: number | null;
  collection: string;
  categoryId: string | null;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  priceCents: number | null;
  currency: string;
  discount: Discount | null;
  price: Price | null;
  status: ArtworkStatus;
  featured: boolean;
  images: AssetDto[];
  publishedAt: string | null;
  soldAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** What the public website receives: no drafts, no internal fields. */
export interface PublicArtworkDto {
  id: string;
  slug: string;
  title: string;
  description: string;
  story: string;
  medium: string;
  dimensions: string;
  year: number | null;
  collection: string;
  category: { name: string; slug: string } | null;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  price: Price | null;
  sold: boolean;
  featured: boolean;
  images: { id: string; alt: string; width: number | null; height: number | null; urls: AssetDto['urls'] }[];
  publishedAt: string | null;
}
