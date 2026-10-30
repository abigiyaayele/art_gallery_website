import type { ColumnType, Generated, Insertable, Selectable, Updateable } from 'kysely';

/** Kysely table types. Keep in step with migrations/*.sql. */
// Insert is optional because every timestamp column has a database default.
type Timestamp = ColumnType<Date, Date | string | undefined, Date | string>;
type Json<T> = ColumnType<T, string, string>;

export interface TenantsTable {
  id: Generated<string>;
  slug: string;
  name: string;
  status: Generated<'active' | 'suspended'>;
  ai_monthly_token_limit: Generated<number>;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface DomainsTable {
  id: Generated<string>;
  tenant_id: string;
  hostname: string;
  is_primary: Generated<boolean>;
  is_platform_subdomain: Generated<boolean>;
  created_at: Timestamp;
}

export interface UsersTable {
  id: Generated<string>;
  email: string;
  name: string;
  password_hash: string;
  is_platform_admin: Generated<boolean>;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface MembershipsTable {
  tenant_id: string;
  user_id: string;
  role: 'owner' | 'editor';
  created_at: Timestamp;
}

export interface RefreshTokensTable {
  id: Generated<string>;
  user_id: string;
  tenant_id: string | null;
  token_hash: string;
  expires_at: Timestamp;
  revoked_at: Timestamp | null;
  created_at: Timestamp;
}

export interface SocialLink {
  label: string;
  url: string;
}

export interface ArtistProfilesTable {
  tenant_id: string;
  display_name: string;
  tagline: Generated<string>;
  bio: Generated<string>;
  statement: Generated<string>;
  location: Generated<string>;
  email: Generated<string>;
  phone: Generated<string>;
  address: Generated<string>;
  hours: Generated<string>;
  social_links: Json<SocialLink[]>;
  photo_asset_id: string | null;
  updated_at: Timestamp;
}

export interface SiteSettingsTable {
  tenant_id: string;
  theme_key: Generated<string>;
  branding: Json<Record<string, unknown>>;
  navigation: Json<unknown[]>;
  seo: Json<Record<string, unknown>>;
  shop: Json<Record<string, unknown>>;
  updated_at: Timestamp;
}

export interface AssetVariant {
  key: string;
  width: number;
  height: number;
  bytes: number;
}

export interface AssetsTable {
  id: Generated<string>;
  tenant_id: string;
  kind: 'artwork' | 'site';
  status: Generated<'processing' | 'ready' | 'failed'>;
  original_key: string;
  original_name: Generated<string>;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  variants: Json<Record<string, AssetVariant>>;
  alt_text: Generated<string>;
  error: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CategoriesTable {
  id: Generated<string>;
  tenant_id: string;
  name: string;
  slug: string;
  sort_order: Generated<number>;
  created_at: Timestamp;
}

export interface ArtworksTable {
  id: Generated<string>;
  tenant_id: string;
  category_id: string | null;
  title: string;
  slug: string;
  description: Generated<string>;
  story: Generated<string>;
  medium: Generated<string>;
  dimensions: Generated<string>;
  year: number | null;
  collection: Generated<string>;
  tags: Generated<string[]>;
  seo_title: Generated<string>;
  seo_description: Generated<string>;
  price_cents: number | null;
  currency: Generated<string>;
  discount_type: 'percent' | 'fixed_price' | null;
  discount_value: number | null;
  status: Generated<'draft' | 'available' | 'sold'>;
  featured: Generated<boolean>;
  sort_order: Generated<number>;
  published_at: Timestamp | null;
  sold_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface ArtworkImagesTable {
  tenant_id: string;
  artwork_id: string;
  asset_id: string;
  position: Generated<number>;
}

export interface Database {
  assets: AssetsTable;
  categories: CategoriesTable;
  artworks: ArtworksTable;
  artwork_images: ArtworkImagesTable;
  tenants: TenantsTable;
  domains: DomainsTable;
  users: UsersTable;
  memberships: MembershipsTable;
  refresh_tokens: RefreshTokensTable;
  artist_profiles: ArtistProfilesTable;
  site_settings: SiteSettingsTable;
}

export type TenantRow = Selectable<TenantsTable>;
export type NewTenantRow = Insertable<TenantsTable>;
export type UserRow = Selectable<UsersTable>;
export type DomainRow = Selectable<DomainsTable>;
export type TenantUpdate = Updateable<TenantsTable>;
export type AssetRow = Selectable<AssetsTable>;
export type ArtworkRow = Selectable<ArtworksTable>;
export type CategoryRow = Selectable<CategoriesTable>;
