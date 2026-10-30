/**
 * Loads Seifu, the first tenant, from the original single-artist site:
 * paintings, prices, sale prices, sold status, photos, profile and About
 * page content. Everything goes through the same use cases the dashboard
 * uses, so nothing about Seifu lives in platform code.
 *
 *   pnpm --filter @platform/api import:seifu            (skips if Seifu already has artworks)
 *   pnpm --filter @platform/api import:seifu -- --force (imports again on top)
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ContentBlock } from '@platform/contracts';
import { buildContainer, defaultInfrastructure } from '../src/container.js';
import { S3ObjectStorage } from '../src/modules/media/infrastructure/object-storage.js';
import { loadConfig } from '../src/shared/config.js';
import type { Actor } from '../src/shared/context.js';
import { createDb } from '../src/shared/db/database.js';
import { InlineJobQueue } from '../src/shared/jobs/queue.js';
import { exhibitions, promotion } from '../seed/seifu/artworks.js';
import { site } from '../seed/seifu/site.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.resolve(here, '../seed/seifu/images');
const force = process.argv.includes('--force');

const config = loadConfig();
const db = createDb(config.DATABASE_URL);
const infra = defaultInfrastructure(config);
if (infra.storage instanceof S3ObjectStorage) await infra.storage.ensureBucket();
// Process images right here instead of through the background worker.
const c = buildContainer(config, db, { ...infra, jobs: new InlineJobQueue() });

const titleCase = (s: string) => s.toLowerCase().replace(/(^|\s|-)(\p{L})/gu, (_m, sep: string, ch: string) => sep + ch.toUpperCase());

let tenant = await db.selectFrom('tenants').select(['id']).where('slug', '=', 'seifu').executeTakeFirst();
if (!tenant) {
  const admin = await db.selectFrom('users').select('id').where('is_platform_admin', '=', true).executeTakeFirst();
  if (!admin) throw new Error('Run `pnpm db:seed` first to create a platform admin');
  const password = process.env.SEIFU_OWNER_PASSWORD ?? 'seifu-demo-password';
  await c.tenancy.onboard.execute(
    { userId: admin.id, tenantId: null, role: null, isPlatformAdmin: true },
    { name: 'Seifu Arts', slug: 'seifu', themeKey: 'atelier', owner: { email: process.env.SEIFU_OWNER_EMAIL ?? 'seifu@example.com', name: 'Seifu', password } },
  );
  tenant = (await db.selectFrom('tenants').select(['id']).where('slug', '=', 'seifu').executeTakeFirstOrThrow())!;
}
const owner = await db.selectFrom('memberships').select('user_id').where('tenant_id', '=', tenant.id).where('role', '=', 'owner').executeTakeFirstOrThrow();
const actor: Actor = { userId: owner.user_id, tenantId: tenant.id, role: 'owner', isPlatformAdmin: false };

const existing = await c.catalog.list.execute(actor, { limit: 1, offset: 0 });
if (existing.total > 0 && !force) {
  console.log(`Seifu already has ${existing.total} artworks; pass --force to import again.`);
  await db.destroy();
  process.exit(0);
}

async function upload(relPath: string, kind: 'artwork' | 'site', alt: string) {
  const data = await fs.readFile(path.join(imagesDir, relPath));
  const asset = await c.media.upload.execute(actor, { filename: path.basename(relPath), data }, kind);
  if (alt) await c.media.update.execute(actor, asset.id, alt);
  return asset.id;
}

// Categories mirror the exhibitions.
const categories = new Map<string, string>();
for (const [i, e] of exhibitions.entries()) {
  const all = await c.catalog.listCategories.execute(actor);
  const found = all.find(cat => cat.name === e.title);
  categories.set(e.title, found?.id ?? (await c.catalog.saveCategory.execute(actor, { name: e.title, sortOrder: i })).id);
}

let count = 0;
for (const e of exhibitions) {
  for (const [i, a] of e.items.entries()) {
    const title = titleCase(a.title);
    const imageId = await upload(a.image.replace(/^\//, ''), 'artwork', `${title}, a painting by Seifu`);
    const created = await c.catalog.create.execute(actor, {
      title,
      description: a.details.join(' '),
      story: a.story,
      medium: titleCase(e.genre),
      dimensions: a.dimensions,
      year: null,
      collection: e.title,
      categoryId: categories.get(e.title) ?? null,
      tags: [e.title.toLowerCase()],
      seoTitle: '',
      seoDescription: '',
      priceCents: a.price * 100,
      currency: 'USD',
      discount: a.salePrice ? { type: 'fixed_price', value: a.salePrice * 100 } : null,
      featured: !e.isPast && i < 3,
      imageIds: [imageId],
    });
    await c.catalog.status.execute(actor, created.id, 'publish');
    if (a.sold) await c.catalog.status.execute(actor, created.id, 'mark_sold');
    count++;
    process.stdout.write(`\rimported ${count} paintings`);
  }
}
console.log();

const portrait = await upload('seifu/seifu-portrait.jpg', 'site', 'Seifu in his studio');
const exhibitionPhoto = await upload('seifu/seifu-exhibition.jpg', 'site', 'Seifu with his paintings at an exhibition');
const solino = [await upload('clients/solino-crema-1.jpg', 'site', 'Solino Crema Selection packaging'), await upload('clients/solino-crema-2.jpg', 'site', 'Solino Crema Selection packaging')];
const collectors: string[] = [];
for (let n = 1; n <= 7; n++) collectors.push(await upload(`clients/collector-${n}.jpg`, 'site', 'Collector with a painting by Seifu'));

await c.site.updateSettings.execute(actor, {
  themeKey: 'atelier',
  branding: { siteTitle: 'Seifu Arts', logoAssetId: null, colors: {}, headingFont: '', bodyFont: '' },
  seo: { title: 'Seifu Arts', description: 'Original paintings by Seifu, an Ethiopian painter of glowing forests, gardens and the people who walk through them.' },
});

await c.site.updateProfile.execute(actor, {
  displayName: site.painter,
  tagline: 'An Ethiopian painter of glowing forests, gardens and the people who walk through them.',
  bio:
    "Seifu's paintings are filled with thousands of hand-painted leaves, flowers and birds. Through them walk women in traditional dress, often under bright umbrellas, on their way to market, to a ceremony or simply home. His work celebrates everyday life, nature and the warmth of Ethiopian culture.",
  statement: '',
  location: 'Addis Ababa',
  email: site.email,
  phone: site.phone,
  address: site.address.join('\n'),
  hours: site.hours,
  socialLinks: [{ label: 'Instagram', url: site.instagram }],
  photoAssetId: portrait,
});

const pages: Record<string, { title: string; enabled?: boolean; blocks: ContentBlock[] }> = {
  home: { title: 'Exhibition', blocks: [{ type: 'artworks', heading: 'Current exhibition', mode: 'featured', limit: 12 }] },
  gallery: { title: 'Archive', blocks: [] },
  offers: { title: 'Offers', blocks: [{ type: 'text', heading: promotion.title, body: `${promotion.message}. Ends ${promotion.endsOn}.` }] },
  about: {
    title: 'About',
    blocks: [
      {
        type: 'features',
        heading: 'How he works',
        items: [
          { title: 'Patterns of nature', text: 'Forests, leaves, flowers and birds are built up one small shape at a time until they fill the whole canvas.' },
          { title: 'People and colour', text: 'Women in traditional dress, bright umbrellas and everyday moments bring warm reds and oranges into the green.' },
          { title: 'Made to order', text: 'Besides original paintings, Seifu creates commissioned work for homes, gifts and brands.' },
        ],
      },
      { type: 'artworks', heading: 'Selected works', mode: 'latest', limit: 4 },
      { type: 'gallery', heading: 'Exhibitions', caption: 'Seifu with his paintings at an exhibition', imageIds: [exhibitionPhoto] },
      {
        type: 'exhibitions',
        heading: '',
        items: exhibitions.map(e => ({ title: e.title, subtitle: titleCase(e.genre), date: e.date, location: e.location })),
      },
      {
        type: 'clients',
        heading: 'Work for clients',
        items: [
          {
            name: 'Solino Coffee',
            project: 'Crema Selection packaging',
            text: "Seifu's women of the coffee ceremony illustrate Solino's Crema Selection, coffee roasted by hand in Ethiopia.",
            imageIds: solino,
          },
        ],
      },
      { type: 'gallery', heading: 'Collectors', caption: "Seifu's paintings now hang in homes and offices around the world. Here are some of the people who took one home.", imageIds: collectors },
      { type: 'cta', heading: 'Want a painting made just for you?', body: '', buttonLabel: 'Request a painting', href: '/commission' },
    ],
  },
  commission: {
    title: 'Commission',
    enabled: true,
    blocks: [
      {
        type: 'text',
        heading: 'Commission a painting',
        body: 'Tell Seifu about the painting you have in mind: the size, the colours, the story. He will reply with a quote and, once you agree, a deposit starts the work.',
      },
    ],
  },
  contact: { title: 'Contact', blocks: [{ type: 'text', heading: 'Visit or write to the studio', body: 'Questions about a painting, a commission or a visit are always welcome.' }] },
};
for (const [slug, page] of Object.entries(pages)) {
  await c.site.savePage.execute(actor, slug as 'home', { title: page.title, enabled: page.enabled ?? true, blocks: page.blocks });
}

console.log(`Seifu's site is ready: ${count} paintings, profile, About page and promotion imported.`);
await db.destroy();
