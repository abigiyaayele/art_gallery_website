import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createPlatformAdmin, login, onboardTenant, pathOf, setupTestApp, uploadImage } from './helpers.js';

let ctx: Awaited<ReturnType<typeof setupTestApp>>;
let seifu: Awaited<ReturnType<typeof onboardTenant>>;
const seifuSite = { 'x-tenant-host': 'seifu.platform.test' };

beforeAll(async () => {
  ctx = await setupTestApp();
  const admin = await createPlatformAdmin(ctx.db);
  const adminToken = (await login(ctx.app, admin.email, admin.password)).token;
  seifu = await onboardTenant(ctx.app, adminToken, 'seifu');
});
afterAll(() => ctx.close());

describe('artwork publishing flow', () => {
  let imageId: string;
  let artworkId: string;

  it('uploads an image and generates WebP variants in tenant folders', async () => {
    const res = await uploadImage(ctx.app, seifu.auth);
    expect(res.statusCode).toBe(201);
    const asset = res.json();
    imageId = asset.id;
    expect(asset.status).toBe('ready');
    expect(asset.width).toBe(64);
    expect(Object.keys(asset.urls).sort()).toEqual(['large', 'medium', 'thumb']);
    const keys = [...ctx.storage.objects.keys()];
    expect(keys.every(k => k.startsWith(`tenants/${seifu.tenant.id}/assets/${imageId}/`))).toBe(true);
    expect(keys.filter(k => k.endsWith('.webp'))).toHaveLength(3);
  });

  it('rejects files that are not images, whatever their name', async () => {
    const res = await uploadImage(ctx.app, seifu.auth, Buffer.from('not really a jpeg'), 'fake.jpg');
    expect(res.statusCode).toBe(400);
  });

  it('creates a draft that the public site does not show', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/artworks',
      headers: seifu.auth,
      payload: { title: 'Under the Vines', description: 'Figures beneath hanging vines.', priceCents: 120000, imageIds: [imageId] },
    });
    expect(res.statusCode).toBe(201);
    artworkId = res.json().id;
    expect(res.json()).toMatchObject({ slug: 'under-the-vines', status: 'draft', price: { effectiveCents: 120000 } });

    const pub = await ctx.app.inject({ method: 'GET', url: '/public/artworks', headers: seifuSite });
    expect(pub.json().items).toHaveLength(0);
  });

  it('keeps draft images private unless the URL is signed', async () => {
    const dto = (await ctx.app.inject({ method: 'GET', url: `/artworks/${artworkId}`, headers: seifu.auth })).json();
    const signed = await ctx.app.inject({ method: 'GET', url: pathOf(dto.images[0].urls.medium) });
    expect(signed.statusCode).toBe(200);
    expect(signed.headers['content-type']).toBe('image/webp');
    const unsigned = await ctx.app.inject({ method: 'GET', url: `/assets/${imageId}/medium` });
    expect(unsigned.statusCode).toBe(404);
  });

  it('publishes, and the painting appears on the public site with public image URLs', async () => {
    const res = await ctx.app.inject({ method: 'POST', url: `/artworks/${artworkId}/publish`, headers: seifu.auth });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe('available');

    const pub = await ctx.app.inject({ method: 'GET', url: '/public/artworks', headers: seifuSite });
    expect(pub.headers['cache-control']).toContain('max-age=15');
    const [item] = pub.json().items;
    expect(item).toMatchObject({ title: 'Under the Vines', sold: false, price: { effectiveCents: 120000, onSale: false } });
    const img = await ctx.app.inject({ method: 'GET', url: pathOf(item.images[0].urls.large) });
    expect(img.statusCode).toBe(200);
    expect(img.headers['cache-control']).toContain('immutable');
  });

  it('reflects a discount on the public site', async () => {
    await ctx.app.inject({
      method: 'PATCH',
      url: `/artworks/${artworkId}`,
      headers: seifu.auth,
      payload: { discount: { type: 'percent', value: 25 } },
    });
    const item = (await ctx.app.inject({ method: 'GET', url: '/public/artworks/under-the-vines', headers: seifuSite })).json();
    expect(item.price).toMatchObject({ regularCents: 120000, effectiveCents: 90000, onSale: true, percentOff: 25 });
    const onSale = (await ctx.app.inject({ method: 'GET', url: '/public/artworks?onSale=true', headers: seifuSite })).json();
    expect(onSale.items).toHaveLength(1);
  });

  it('shows sold status, and only an owner can revert a sale', async () => {
    await ctx.app.inject({ method: 'POST', url: `/artworks/${artworkId}/mark-sold`, headers: seifu.auth });
    const item = (await ctx.app.inject({ method: 'GET', url: '/public/artworks/under-the-vines', headers: seifuSite })).json();
    expect(item.sold).toBe(true);

    const unpublish = await ctx.app.inject({ method: 'POST', url: `/artworks/${artworkId}/unpublish`, headers: seifu.auth });
    expect(unpublish.statusCode).toBe(422);
    const revert = await ctx.app.inject({ method: 'POST', url: `/artworks/${artworkId}/revert-sold`, headers: seifu.auth });
    expect(revert.json().status).toBe('available');
  });

  it('refuses to publish an artwork without a price', async () => {
    const draft = await ctx.app.inject({ method: 'POST', url: '/artworks', headers: seifu.auth, payload: { title: 'Untitled study', imageIds: [imageId] } });
    const res = await ctx.app.inject({ method: 'POST', url: `/artworks/${draft.json().id}/publish`, headers: seifu.auth });
    expect(res.statusCode).toBe(422);
    expect(res.json().error.details.missing).toEqual(['price']);
  });

  it('applies bulk actions and reports what could not change', async () => {
    const list = (await ctx.app.inject({ method: 'GET', url: '/artworks', headers: seifu.auth })).json();
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/artworks/bulk',
      headers: seifu.auth,
      payload: { ids: list.items.map((a: { id: string }) => a.id), action: 'publish' },
    });
    expect(res.json().updated).toBe(1);
    expect(res.json().failed).toHaveLength(1);
  });

  it('filters by category on the public site', async () => {
    const cat = (await ctx.app.inject({ method: 'POST', url: '/categories', headers: seifu.auth, payload: { name: 'Forest Series' } })).json();
    expect(cat.slug).toBe('forest-series');
    await ctx.app.inject({ method: 'PATCH', url: `/artworks/${artworkId}`, headers: seifu.auth, payload: { categoryId: cat.id } });
    const res = (await ctx.app.inject({ method: 'GET', url: '/public/artworks?category=forest-series', headers: seifuSite })).json();
    expect(res.items.map((a: { title: string }) => a.title)).toEqual(['Under the Vines']);
    expect(res.items[0].category).toEqual({ name: 'Forest Series', slug: 'forest-series' });
  });

  it('will not delete an image that an artwork uses', async () => {
    const res = await ctx.app.inject({ method: 'DELETE', url: `/media/${imageId}`, headers: seifu.auth });
    expect(res.statusCode).toBe(422);
  });

  it('returns 404 for hosts that are not connected to a tenant', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/public/artworks', headers: { 'x-tenant-host': 'nobody.platform.test' } });
    expect(res.statusCode).toBe(404);
  });
});
