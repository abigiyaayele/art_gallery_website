import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sql } from 'kysely';
import { buildApp } from '../src/app.js';
import { buildContainer } from '../src/container.js';
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
});

/** Fresh schema, migrated, plus an app wired exactly like production. */
export async function setupTestApp(overrides: (c: ReturnType<typeof buildContainer>) => void = () => {}) {
  const db = createDb(TEST_DB_URL);
  await sql`DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;`.execute(db);
  await migrate(db, path.resolve(here, '../migrations'));
  const container = buildContainer(testConfig, db);
  overrides(container);
  const app = await buildApp(testConfig, container);
  return { app, db, container, close: async () => (await app.close(), await db.destroy()) };
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
