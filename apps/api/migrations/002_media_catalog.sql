-- Uploaded images. Originals and generated variants live in object storage
-- under tenants/{tenant_id}/assets/{id}/.
CREATE TABLE assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('artwork', 'site')),
  status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
  original_key text NOT NULL,
  original_name text NOT NULL DEFAULT '',
  mime_type text NOT NULL,
  size_bytes integer NOT NULL,
  width integer,
  height integer,
  variants jsonb NOT NULL DEFAULT '{}',
  alt_text text NOT NULL DEFAULT '',
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX assets_tenant_idx ON assets (tenant_id, created_at DESC);

CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

CREATE TABLE artworks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text NOT NULL,
  description text NOT NULL DEFAULT '',
  story text NOT NULL DEFAULT '',
  medium text NOT NULL DEFAULT '',
  dimensions text NOT NULL DEFAULT '',
  year integer,
  collection text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  seo_title text NOT NULL DEFAULT '',
  seo_description text NOT NULL DEFAULT '',
  price_cents integer CHECK (price_cents IS NULL OR price_cents > 0),
  currency text NOT NULL DEFAULT 'USD',
  discount_type text CHECK (discount_type IN ('percent', 'fixed_price')),
  discount_value integer,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'available', 'sold')),
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  sold_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug),
  CHECK ((discount_type IS NULL) = (discount_value IS NULL))
);
CREATE INDEX artworks_tenant_status_idx ON artworks (tenant_id, status, sort_order, created_at DESC);
CREATE INDEX artworks_tenant_category_idx ON artworks (tenant_id, category_id);

CREATE TABLE artwork_images (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  artwork_id uuid NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  PRIMARY KEY (artwork_id, asset_id)
);
CREATE INDEX artwork_images_asset_idx ON artwork_images (asset_id);
