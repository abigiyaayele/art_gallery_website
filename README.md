# Artist Platform

One platform for many artists. Each artist gets a dashboard to manage their artworks, prices, sales,
website content, inquiries and payments, and a themed public website on their own domain. Seifu Arts
(the site this repository started as) is the first artist on it.

- **Dashboard** (`apps/dashboard`): artworks with Draft / Published / Sold, images, pricing and
  discounts, sold work, shop orders, inquiries, website editor (theme, branding, page content),
  profile, payments, AI assistant, goals and journal, overview.
- **Artist websites** (`apps/web`): one bundle serves every artist. The visitor's host picks the
  artist, the artist's theme key picks the look. Themes: `atelier` (Seifu's original design) and
  `minimal`. Changes in the dashboard show up within about 30 seconds, without a redeploy.
- **API** (`apps/api`): Node + TypeScript, Fastify, PostgreSQL (Kysely), MinIO/S3 for images,
  pg-boss for background jobs, Chapa for payments, Claude for the AI assistant.
- **Contracts** (`packages/contracts`): Zod schemas and DTO types shared by all three apps.

## How it is built

The API follows clean architecture per module (`identity`, `tenancy`, `media`, `catalog`, `site`,
`commerce`, `inquiries`, `analytics`, `ai`), each with `domain` / `application` / `infrastructure` /
`presentation` layers. Use cases depend on ports (interfaces); `src/container.ts` is the one place
that picks adapters. Tests swap in memory storage, an inline job queue and fake payment / AI providers.

**Tenant isolation.** Every table carries `tenant_id`, every repository query filters on it, and the
tenant always comes from the signed access token (dashboard) or the resolved host (public site),
never from the request body. Another tenant's record answers 404. `test/isolation.test.ts` and the
module tests check this route by route.

**Images.** Uploads are validated, stored under `tenants/{id}/assets/{id}/`, and turned into WebP
thumb / medium / large variants with EXIF (including GPS) stripped. Draft images are served through
short-lived signed URLs; published images are public and cached for a year.

**Payments.** Each artist connects their own Chapa account; keys are encrypted with AES-256-GCM.
Checkout holds a piece for 15 minutes. Payments are confirmed by verifying with Chapa (amount and
currency checked) from both the signed webhook and the return page, idempotently; a paid artwork is
marked sold automatically.

**AI assistant.** Drafts artwork titles, descriptions, stories and tags from the cover image; suggests
new work; answers questions about the artist's own catalog and sales; writes a weekly journal summary.
The model only ever sees the calling artist's data. Drafts are stored as suggestions and nothing
changes until the artist applies the parts they want. Usage is metered per artist per month
(`tenants.ai_monthly_token_limit`, default 200k tokens). Without `ANTHROPIC_API_KEY` the assistant
says it is not set up.

## Run it locally

Needs Node 20+, pnpm (`corepack enable`) and Docker.

```bash
pnpm install
docker compose -f infra/docker-compose.yml up -d     # Postgres + MinIO
cp apps/api/.env.example apps/api/.env               # set JWT_SECRET, ENCRYPTION_KEY, admin login
pnpm db:migrate
SEED_DEMO_TENANTS=true pnpm db:seed                  # platform admin + demo artists "seifu" and "artist-b"
pnpm --filter @platform/api import:seifu             # optional: Seifu's 35 paintings, profile and pages

pnpm dev:api          # http://localhost:4000
pnpm dev:dashboard    # http://localhost:5173
pnpm dev:web          # http://seifu.localhost:3000 and http://artist-b.localhost:3000
```

Demo logins (from the seed): `admin@example.com` / the `ADMIN_PASSWORD` you set,
`seifu@example.com` / `seifu-demo-password`, `artistb@example.com` / `artistb-demo-password`.

`*.localhost` resolves to your machine in modern browsers. To pin one artist on plain
`localhost:3000`, set `DEV_TENANT_HOST=seifu.localhost` in `apps/web/.env`.

Checks: `pnpm typecheck`, `pnpm lint`, `pnpm test` (API tests need the `platform_test` database that
`infra/init-test-db.sql` creates), `pnpm build`.

## Onboard a new artist

1. Sign in to the dashboard as the platform admin and open **Tenants (admin)**.
2. Enter the artist's name, a slug (e.g. `hana`) and their login. This creates the workspace, the
   owner account, default pages, and the site at `hana.<PLATFORM_DOMAIN>`.
3. The artist signs in, fills in **Profile**, picks a theme in **Website**, uploads work in
   **Artworks** and publishes it.
4. Optional: in **Settings** they add a custom domain (point its DNS A record at the server) and
   connect Chapa to take payments online. Until then the site shows "Inquire to buy".

## Add a website theme

1. Add the key to `themeKeys` in `packages/contracts/src/site.ts`.
2. Create `apps/web/src/themes/<key>/` with a default-exported component that renders its own
   `<Routes>`. Read data with `useSite()`, `usePage(slug)`, `useBlocks(slug, type)` from
   `src/platform/SiteProvider.tsx`, submit forms with `src/platform/forms.ts`, and use
   `src/platform/useOrderStatus.ts` for the payment return page. `themes/minimal/` is a compact example.
3. Register it in `apps/web/src/themes/index.ts` (lazy-loaded) and add its colour tokens under
   `:root[data-theme='<key>']` in `apps/web/src/index.css`. Artist branding arrives as `--brand-*`
   variables; fall back to your defaults.
4. Describe it in `themeInfo` in `apps/dashboard/src/pages/WebsitePage.tsx` so artists can pick it.

## Deploy

`infra/docker-compose.prod.yml` runs everything on one server: Postgres, MinIO, the API (migrates on
start), the sites server, the dashboard (nginx, proxying `/api`), and Caddy for HTTPS. Caddy issues
certificates on demand for artist subdomains and custom domains, asking the API (`/tls/allowed`)
first so only real artist hosts get one.

```bash
cp infra/.env.prod.example infra/.env.prod   # fill in secrets and your domain
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env.prod up -d
docker compose -f infra/docker-compose.prod.yml --env-file infra/.env.prod exec api node dist/scripts/seed.js
```

DNS: point `app.<domain>` and `*.<domain>` at the server. Pushing to `main` builds the three images
and publishes them to GHCR (`.github/workflows/release.yml`); `docker compose pull && up -d` updates.
