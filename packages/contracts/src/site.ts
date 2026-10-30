import { z } from 'zod';
import { uuid } from './common.js';

const text = (max: number) => z.string().trim().max(max);
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a hex colour like #1f3d2b');

export const themeKeys = ['atelier', 'minimal'] as const;
export const themeKeySchema = z.enum(themeKeys);
export type ThemeKey = z.infer<typeof themeKeySchema>;

export const socialLinkSchema = z.object({ label: text(40).min(1), url: z.string().url().max(300) });

export const profileInput = z.object({
  displayName: text(120).min(1),
  tagline: text(200).default(''),
  bio: text(5000).default(''),
  statement: text(5000).default(''),
  location: text(120).default(''),
  email: z.union([z.literal(''), z.string().email().max(254)]).default(''),
  phone: text(40).default(''),
  address: text(300).default(''),
  hours: text(120).default(''),
  socialLinks: z.array(socialLinkSchema).max(10).default([]),
  photoAssetId: uuid.nullable().default(null),
});
export type ProfileInput = z.infer<typeof profileInput>;

export const brandingSchema = z.object({
  siteTitle: text(80).default(''),
  logoAssetId: uuid.nullable().default(null),
  colors: z
    .object({ background: hexColor, text: hexColor, accent: hexColor })
    .partial()
    .default({}),
  headingFont: text(60).default(''),
  bodyFont: text(60).default(''),
});
export type Branding = z.infer<typeof brandingSchema>;

export const pageSlugs = ['home', 'gallery', 'offers', 'about', 'commission', 'contact'] as const;
export const pageSlugSchema = z.enum(pageSlugs);
export type PageSlug = z.infer<typeof pageSlugSchema>;

export const siteSettingsInput = z.object({
  themeKey: themeKeySchema,
  branding: brandingSchema,
  seo: z.object({ title: text(70).default(''), description: text(170).default('') }).default({}),
});
export type SiteSettingsInput = z.infer<typeof siteSettingsInput>;

/** Content blocks: each theme decides how to draw them. */
const imageIds = z.array(uuid).max(24).default([]);
export const contentBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('hero'), heading: text(200), subheading: text(400).default(''), imageIds }),
  z.object({ type: z.literal('text'), heading: text(200).default(''), body: text(10000) }),
  z.object({
    type: z.literal('features'),
    heading: text(200).default(''),
    items: z.array(z.object({ title: text(120), text: text(1000) })).max(12),
  }),
  z.object({ type: z.literal('gallery'), heading: text(200).default(''), caption: text(400).default(''), imageIds }),
  z.object({
    type: z.literal('clients'),
    heading: text(200).default(''),
    items: z.array(z.object({ name: text(120), project: text(200).default(''), text: text(1000).default(''), imageIds })).max(20),
  }),
  z.object({
    type: z.literal('exhibitions'),
    heading: text(200).default(''),
    items: z.array(z.object({ title: text(200), subtitle: text(200).default(''), date: text(80).default(''), location: text(120).default('') })).max(50),
  }),
  z.object({ type: z.literal('artworks'), heading: text(200).default(''), mode: z.enum(['featured', 'latest', 'on_sale']).default('latest'), limit: z.number().int().min(1).max(24).default(4) }),
  z.object({ type: z.literal('cta'), heading: text(200), body: text(1000).default(''), buttonLabel: text(60).default(''), href: text(300).default('') }),
]);
export type ContentBlock = z.infer<typeof contentBlockSchema>;

export const sitePageInput = z.object({
  title: text(120).default(''),
  enabled: z.boolean().default(true),
  blocks: z.array(contentBlockSchema).max(40),
});
export type SitePageInput = z.infer<typeof sitePageInput>;

export interface ProfileDto extends ProfileInput {
  photoUrl: string | null;
}

export interface SiteSettingsDto extends SiteSettingsInput {
  logoUrl: string | null;
}

export interface SitePageDto extends SitePageInput {
  slug: PageSlug;
}

/** Image URLs for the images a block references, keyed by asset id. */
export type ImageMap = Record<string, { url: string; thumb: string; alt: string; width: number | null; height: number | null }>;

export interface PublicSiteDto {
  tenant: { name: string; slug: string };
  primaryHost: string;
  themeKey: ThemeKey;
  branding: Branding & { logoUrl: string | null };
  seo: { title: string; description: string };
  profile: Omit<ProfileDto, 'photoAssetId'>;
  pages: SitePageDto[];
  images: ImageMap;
  shop: { paymentsEnabled: boolean; holdMinutes: number };
}
