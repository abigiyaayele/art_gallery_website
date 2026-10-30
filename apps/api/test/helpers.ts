import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sql } from 'kysely';
import { buildApp } from '../src/app.js';
import { buildContainer } from '../src/container.js';
import { MemoryObjectStorage } from '../src/modules/media/infrastructure/object-storage.js';
import { InlineJobQueue } from '../src/shared/jobs/queue.js';
import type { InitializeRequest, PaymentProvider, VerifiedPayment } from '../src/modules/commerce/application/ports.js';
import crypto from 'node:crypto';
import type { AiProvider, AiRequest, AiResult } from '../src/modules/ai/application/ports.js';

/** Stands in for Claude: records each request and replies with whatever the test queued. */
export class FakeAiProvider implements AiProvider {
  configured = true;
  readonly requests: AiRequest[] = [];
  replies: string[] = [];
  usage = { inputTokens: 1200, outputTokens: 300 };

  async generate(req: AiRequest): Promise<AiResult> {
    this.requests.push(req);
    return { text: this.replies.shift() ?? 'Here is my thought.', usage: this.usage };
  }
}

/** Stands in for Chapa: records checkouts and answers verification however the test says. */
export class FakePaymentProvider implements PaymentProvider {
  readonly name = 'fake';
  readonly initialized: InitializeRequest[] = [];
  results = new Map<string, Partial<VerifiedPayment>>();
  failInitialize = false;

  async initialize(_creds: unknown, req: InitializeRequest) {
    if (this.failInitialize) throw new Error('provider down');
    this.initialized.push(req);
    return { checkoutUrl: `https://pay.test/checkout/${req.txRef}` };
  }

  async verify(_creds: unknown, txRef: string): Promise<VerifiedPayment> {
    const req = this.initialized.find(r => r.txRef === txRef);
    return { status: 'pending', amountCents: req?.amountCents ?? 0, currency: req?.currency ?? 'USD', reference: `ref-${txRef}`, raw: {}, ...this.results.get(txRef) };
  }

  isValidWebhook(creds: { webhookSecret: string }, rawBody: Buffer, headers: Record<string, string | string[] | undefined>) {
    return headers['x-chapa-signature'] === crypto.createHmac('sha256', creds.webhookSecret).update(rawBody).digest('hex');
  }

  webhookTxRef(body: unknown) {
    return (body as { tx_ref?: string })?.tx_ref;
  }
}
import { loadConfig } from '../src/shared/config.js';
import { createDb, type Db } from '../src/shared/db/database.js';
import { migrate } from '../src/shared/db/migrate.js';
import { Argon2Hasher } from '../src/modules/identity/infrastructure/crypto.js';

const here = path.dirname(fileURLToPath(import.meta.url));
export const TEST_DB_URL = process.env.TEST_DATABASE_URL ?? 'postgres://platform:platform@localhost:5432/platform_test';

export const testConfig = loadConfig({
  NODE_ENV: 'test',
  DATABASE_URL: TEST_DB_URL,
  JWT_SECRET: 'test-secret-test-secret-test-secret-123',
  ENCRYPTION_KEY: Buffer.alloc(32, 7).toString('base64'),
  PLATFORM_DOMAIN: 'platform.test',
  PUBLIC_API_URL: 'http://api.platform.test',
  SITE_URL_TEMPLATE: 'https://{host}',
});

/** Fresh schema, migrated, plus an app wired exactly like production. */
export async function setupTestApp(overrides: (c: ReturnType<typeof buildContainer>) => void = () => {}) {
  const db = createDb(TEST_DB_URL);
  await sql`DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;`.execute(db);
  await migrate(db, path.resolve(here, '../migrations'));
  const storage = new MemoryObjectStorage();
  const jobs = new InlineJobQueue();
  const payments = new FakePaymentProvider();
  const ai = new FakeAiProvider();
  const container = buildContainer(testConfig, db, { storage, jobs, payments, ai });
  overrides(container);
  const app = await buildApp(testConfig, container);
  return { app, db, container, storage, jobs, payments, ai, close: async () => (await app.close(), await db.destroy()) };
}

export type TestApp = Awaited<ReturnType<typeof setupTestApp>>['app'];

export async function createPlatformAdmin(db: Db, email = 'admin@platform.test', password = 'admin-password-123') {
  await db
    .insertInto('users')
    .values({ email, name: 'Admin', password_hash: await new Argon2Hasher().hash(password), is_platform_admin: true })
    .execute();
  return { email, password };
}

export async function login(app: TestApp, email: string, password: string) {
  const res = await app.inject({ method: 'POST', url: '/auth/login', payload: { email, password } });
  if (res.statusCode !== 200) throw new Error(`login failed: ${res.statusCode} ${res.body}`);
  const cookie = res.cookies.find(c => c.name === 'rt');
  return { token: res.json().accessToken as string, refreshCookie: cookie?.value, session: res.json() };
}

/** Onboards a tenant through the admin API and signs its owner in. */
export async function onboardTenant(app: TestApp, adminToken: string, slug: string) {
  const owner = { email: `${slug}@artists.test`, name: `${slug} owner`, password: `${slug}-password-123` };
  const res = await app.inject({
    method: 'POST',
    url: '/admin/tenants',
    headers: { authorization: `Bearer ${adminToken}` },
    payload: { name: `Artist ${slug}`, slug, owner },
  });
  if (res.statusCode !== 201) throw new Error(`onboard failed: ${res.statusCode} ${res.body}`);
  const { token } = await login(app, owner.email, owner.password);
  return { tenant: res.json(), owner, token, auth: { authorization: `Bearer ${token}` } };
}

/** A small real PNG, so uploads go through sharp like a photo would. */
export async function samplePng(width = 64, height = 48) {
  const sharp = (await import('sharp')).default;
  return sharp({ create: { width, height, channels: 3, background: { r: 180, g: 90, b: 40 } } }).png().toBuffer();
}

export async function uploadImage(app: TestApp, auth: Record<string, string>, data?: Buffer, filename = 'painting.png', kind = 'artwork') {
  const form = new FormData();
  form.append('file', new Blob([data ?? (await samplePng())]), filename);
  return app.inject({ method: 'POST', url: `/media?kind=${kind}`, headers: auth, payload: form });
}

/** Path + query of an absolute asset URL, for app.inject. */
export const pathOf = (url: string) => {
  const u = new URL(url);
  return u.pathname + u.search;
};

/** Uploads an image, creates an artwork and publishes it. */
export async function publishArtwork(app: TestApp, auth: Record<string, string>, title: string, priceCents = 100000, extra: Record<string, unknown> = {}) {
  const imageId = (await uploadImage(app, auth)).json().id;
  const created = await app.inject({ method: 'POST', url: '/artworks', headers: auth, payload: { title, priceCents, imageIds: [imageId], ...extra } });
  if (created.statusCode !== 201) throw new Error(created.body);
  const published = await app.inject({ method: 'POST', url: `/artworks/${created.json().id}/publish`, headers: auth });
  return published.json();
}
