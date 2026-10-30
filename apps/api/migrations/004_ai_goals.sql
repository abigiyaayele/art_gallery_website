-- Tokens each workspace spent on the AI assistant per calendar month (UTC).
CREATE TABLE ai_usage (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  month text NOT NULL,
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  requests integer NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, month)
);

-- AI drafts wait here until the artist applies or dismisses them.
CREATE TABLE ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  artwork_id uuid REFERENCES artworks(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('artwork_copy', 'ideas')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'dismissed')),
  input jsonb NOT NULL DEFAULT '{}',
  output jsonb NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_suggestions_tenant_idx ON ai_suggestions (tenant_id, created_at DESC);

CREATE TABLE goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title text NOT NULL,
  notes text NOT NULL DEFAULT '',
  target integer,
  current integer NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT '',
  due_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'done', 'dropped')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX goals_tenant_idx ON goals (tenant_id, created_at DESC);

CREATE TABLE journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'entry' CHECK (kind IN ('entry', 'summary')),
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX journal_tenant_idx ON journal_entries (tenant_id, created_at DESC);
