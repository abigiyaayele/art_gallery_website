/**
 * Creates the first platform admin (ADMIN_EMAIL / ADMIN_PASSWORD) and, with
 * SEED_DEMO_TENANTS=true, two demo tenants. Safe to run more than once.
 */
import { buildContainer } from '../src/container.js';
import { Argon2Hasher } from '../src/modules/identity/infrastructure/crypto.js';
import { loadConfig } from '../src/shared/config.js';
import { createDb } from '../src/shared/db/database.js';

const config = loadConfig();
const db = createDb(config.DATABASE_URL);
const container = buildContainer(config, db);

const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD;
if (!adminEmail || !adminPassword) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD');

let admin = await db.selectFrom('users').select(['id']).where('email', '=', adminEmail).executeTakeFirst();
if (!admin) {
  admin = await db
    .insertInto('users')
    .values({ email: adminEmail, name: 'Platform admin', password_hash: await new Argon2Hasher().hash(adminPassword), is_platform_admin: true })
    .returning('id')
    .executeTakeFirstOrThrow();
  console.log(`created platform admin ${adminEmail}`);
}

const actor = { userId: admin.id, tenantId: null, role: null, isPlatformAdmin: true };

if (process.env.SEED_DEMO_TENANTS === 'true') {
  const demos = [
    { name: 'Seifu Arts', slug: 'seifu', themeKey: 'atelier', owner: { email: 'seifu@example.com', name: 'Seifu', password: 'seifu-demo-password' } },
    { name: 'Artist B Studio', slug: 'artist-b', themeKey: 'minimal', owner: { email: 'artistb@example.com', name: 'Artist B', password: 'artistb-demo-password' } },
  ];
  for (const demo of demos) {
    if (await db.selectFrom('tenants').select('id').where('slug', '=', demo.slug).executeTakeFirst()) continue;
    await container.tenancy.onboard.execute(actor, demo);
    console.log(`onboarded ${demo.slug} (owner ${demo.owner.email} / ${demo.owner.password})`);
  }
}

await db.destroy();
