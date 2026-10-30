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

export interface SitePagesTable {
  tenant_id: string;
  slug: string;
  title: Generated<string>;
  enabled: Generated<boolean>;
  blocks: Json<unknown[]>;
  updated_at: Timestamp;
}

export interface InquiriesTable {
  id: Generated<string>;
  tenant_id: string;
  kind: 'contact' | 'commission' | 'purchase';
  status: Generated<'new' | 'replied' | 'archived'>;
  name: string;
  email: string;
  phone: Generated<string>;
  subject: Generated<string>;
  message: string;
  details: Json<Record<string, string>>;
  artwork_id: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface TenantSecretsTable {
  tenant_id: string;
  name: string;
  ciphertext: string;
  updated_at: Timestamp;
}

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'expired' | 'shipped' | 'refunded';

export interface OrdersTable {
  id: Generated<string>;
  tenant_id: string;
  kind: 'artwork' | 'deposit';
  artwork_id: string | null;
  artwork_title: Generated<string>;
  amount_cents: number;
  currency: string;
  status: Generated<OrderStatus>;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: Generated<string>;
  shipping: Json<Record<string, string>>;
  note: Generated<string>;
  tx_ref: string;
  hold_expires_at: Timestamp | null;
  paid_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface PaymentsTable {
  id: Generated<string>;
  tenant_id: string;
  order_id: string;
  provider: string;
  provider_reference: Generated<string>;
  status: string;
  raw: Json<unknown>;
  verified_at: Timestamp | null;
  created_at: Timestamp;
}

export interface PageViewsTable {
  tenant_id: string;
  day: ColumnType<string, string, string>;
  path: string;
  views: Generated<number>;
}

export interface AiUsageTable {
  tenant_id: string;
  month: string;
  input_tokens: Generated<number>;
  output_tokens: Generated<number>;
  requests: Generated<number>;
}

export interface AiSuggestionsTable {
  id: Generated<string>;
  tenant_id: string;
  artwork_id: string | null;
  kind: 'artwork_copy' | 'ideas';
  status: Generated<'pending' | 'applied' | 'dismissed'>;
  input: Json<Record<string, unknown>>;
  output: Json<Record<string, unknown>>;
  created_by: string | null;
  created_at: Timestamp;
}

export interface GoalsTable {
  id: Generated<string>;
  tenant_id: string;
  title: string;
  notes: Generated<string>;
  target: number | null;
  current: Generated<number>;
  unit: Generated<string>;
  due_date: ColumnType<string | null, string | null | undefined, string | null>;
  status: Generated<'active' | 'done' | 'dropped'>;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface JournalEntriesTable {
  id: Generated<string>;
  tenant_id: string;
  kind: Generated<'entry' | 'summary'>;
  body: string;
  created_at: Timestamp;
}

export interface Database {
  site_pages: SitePagesTable;
  inquiries: InquiriesTable;
  tenant_secrets: TenantSecretsTable;
  orders: OrdersTable;
  payments: PaymentsTable;
  page_views: PageViewsTable;
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
  ai_usage: AiUsageTable;
  ai_suggestions: AiSuggestionsTable;
  goals: GoalsTable;
  journal_entries: JournalEntriesTable;
}

export type TenantRow = Selectable<TenantsTable>;
export type NewTenantRow = Insertable<TenantsTable>;
export type UserRow = Selectable<UsersTable>;
export type DomainRow = Selectable<DomainsTable>;
export type TenantUpdate = Updateable<TenantsTable>;
export type AssetRow = Selectable<AssetsTable>;
export type ArtworkRow = Selectable<ArtworksTable>;
export type CategoryRow = Selectable<CategoriesTable>;
export type OrderRow = Selectable<OrdersTable>;
export type InquiryRow = Selectable<InquiriesTable>;
