-- Website pages are ordered lists of typed content blocks, edited in the dashboard.
CREATE TABLE site_pages (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  blocks jsonb NOT NULL DEFAULT '[]',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, slug)
);

-- Messages from website visitors: contact, commission requests, purchase questions.
CREATE TABLE inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('contact', 'commission', 'purchase')),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'replied', 'archived')),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  message text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}',
  artwork_id uuid REFERENCES artworks(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX inquiries_tenant_idx ON inquiries (tenant_id, status, created_at DESC);

-- Per-tenant secrets (payment keys), encrypted with AES-256-GCM by the API.
CREATE TABLE tenant_secrets (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  ciphertext text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, name)
);

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('artwork', 'deposit')),
  artwork_id uuid REFERENCES artworks(id) ON DELETE SET NULL,
  artwork_title text NOT NULL DEFAULT '',
  amount_cents integer NOT NULL CHECK (amount_cents > 0),
  currency text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'expired', 'shipped', 'refunded')),
  buyer_name text NOT NULL,
  buyer_email text NOT NULL,
  buyer_phone text NOT NULL DEFAULT '',
  shipping jsonb NOT NULL DEFAULT '{}',
  note text NOT NULL DEFAULT '',
  tx_ref text NOT NULL UNIQUE,
  hold_expires_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orders_tenant_idx ON orders (tenant_id, created_at DESC);
-- At most one live checkout hold per artwork.
CREATE UNIQUE INDEX orders_one_pending_hold ON orders (artwork_id) WHERE status = 'pending' AND artwork_id IS NOT NULL;

CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_reference text NOT NULL DEFAULT '',
  status text NOT NULL,
  raw jsonb NOT NULL DEFAULT '{}',
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX payments_order_idx ON payments (order_id);

-- Daily page view counters for the overview page; no visitor data is stored.
CREATE TABLE page_views (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  day date NOT NULL,
  path text NOT NULL,
  views integer NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, day, path)
);
