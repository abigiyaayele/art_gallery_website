import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createPlatformAdmin, login, onboardTenant, setupTestApp, uploadImage } from './helpers.js';

let ctx: Awaited<ReturnType<typeof setupTestApp>>;
let seifu: Awaited<ReturnType<typeof onboardTenant>>;
let other: Awaited<ReturnType<typeof onboardTenant>>;

beforeAll(async () => {
  ctx = await setupTestApp();
  const admin = await createPlatformAdmin(ctx.db);
  const adminToken = (await login(ctx.app, admin.email, admin.password)).token;
  seifu = await onboardTenant(ctx.app, adminToken, 'seifu');
  other = await onboardTenant(ctx.app, adminToken, 'artist-b');
});
afterAll(() => ctx.close());

describe('website content', () => {
  it('serves a starter site for a new tenant', async () => {
    const site = (await ctx.app.inject({ method: 'GET', url: '/public/site', headers: { 'x-tenant-host': 'artist-b.platform.test' } })).json();
    expect(site.tenant).toEqual({ name: 'Artist artist-b', slug: 'artist-b' });
    expect(site.themeKey).toBe('minimal');
    expect(site.pages.map((p: { slug: string }) => p.slug)).toEqual(['home', 'gallery', 'offers', 'about', 'contact']);
    expect(site.shop.paymentsEnabled).toBe(false);
  });

  it('saves branding, profile and pages and serves them by host', async () => {
    const logo = (await uploadImage(ctx.app, seifu.auth, undefined, 'logo.png', 'site')).json();
    const portrait = (await uploadImage(ctx.app, seifu.auth, undefined, 'portrait.png', 'site')).json();

    const settings = await ctx.app.inject({
      method: 'PUT',
      url: '/site/settings',
      headers: seifu.auth,
      payload: { themeKey: 'atelier', branding: { siteTitle: 'Seifu Arts', logoAssetId: logo.id, colors: { accent: '#c2410c' } }, seo: {} },
    });
    expect(settings.statusCode).toBe(204);

    await ctx.app.inject({
      method: 'PUT',
      url: '/site/profile',
      headers: seifu.auth,
      payload: { displayName: 'Seifu', tagline: 'Painter of glowing forests', location: 'Addis Ababa', photoAssetId: portrait.id },
    });

    const page = await ctx.app.inject({
      method: 'PUT',
      url: '/site/pages/about',
      headers: seifu.auth,
      payload: {
        title: 'About',
        blocks: [
          { type: 'text', heading: 'About the painter', body: 'Thousands of hand-painted leaves.' },
          { type: 'gallery', heading: 'Exhibitions', imageIds: [portrait.id] },
        ],
      },
    });
    expect(page.statusCode).toBe(204);

    const site = (await ctx.app.inject({ method: 'GET', url: '/public/site', headers: { 'x-tenant-host': 'seifu.platform.test' } })).json();
    expect(site.themeKey).toBe('atelier');
    expect(site.branding.siteTitle).toBe('Seifu Arts');
    expect(site.branding.colors.accent).toBe('#c2410c');
    expect(site.branding.logoUrl).toMatch(/^http:\/\/api\.platform\.test\/assets\//);
    expect(site.profile.photoUrl).toBeTruthy();
    expect(site.profile).not.toHaveProperty('photoAssetId');
    const about = site.pages.find((p: { slug: string }) => p.slug === 'about');
    expect(about.blocks[0].body).toBe('Thousands of hand-painted leaves.');
    expect(site.images[portrait.id].url).toBeTruthy();
    expect(site.seo.description).toBe('Painter of glowing forests');
  });

  it('serves site images publicly without a signature', async () => {
    const site = (await ctx.app.inject({ method: 'GET', url: '/public/site', headers: { 'x-tenant-host': 'seifu.platform.test' } })).json();
    const res = await ctx.app.inject({ method: 'GET', url: new URL(site.branding.logoUrl).pathname });
    expect(res.statusCode).toBe(200);
  });

  it('hides disabled pages from the public site', async () => {
    await ctx.app.inject({ method: 'PUT', url: '/site/pages/offers', headers: seifu.auth, payload: { title: 'Offers', enabled: false, blocks: [] } });
    const site = (await ctx.app.inject({ method: 'GET', url: '/public/site', headers: { 'x-tenant-host': 'seifu.platform.test' } })).json();
    expect(site.pages.some((p: { slug: string }) => p.slug === 'offers')).toBe(false);
  });

  it("refuses another tenant's images in branding or pages", async () => {
    const theirs = (await uploadImage(ctx.app, other.auth, undefined, 'x.png', 'site')).json();
    const res = await ctx.app.inject({
      method: 'PUT',
      url: '/site/pages/home',
      headers: seifu.auth,
      payload: { blocks: [{ type: 'hero', heading: 'Hi', imageIds: [theirs.id] }] },
    });
    expect(res.statusCode).toBe(400);
  });

  it('serves a custom domain once connected', async () => {
    await ctx.app.inject({ method: 'POST', url: '/workspace/domains', headers: seifu.auth, payload: { hostname: 'seifuarts.com' } });
    const site = await ctx.app.inject({ method: 'GET', url: '/public/site', headers: { 'x-tenant-host': 'seifuarts.com' } });
    expect(site.json().tenant.slug).toBe('seifu');
  });

  it('records page views and stores inquiries for the right tenant', async () => {
    const host = { 'x-tenant-host': 'seifu.platform.test' };
    await ctx.app.inject({ method: 'POST', url: '/public/views', headers: host, payload: { path: '/about?x=1' } });
    const sent = await ctx.app.inject({
      method: 'POST',
      url: '/public/inquiries',
      headers: host,
      payload: { kind: 'commission', name: 'Abebe', email: 'abebe@example.com', message: 'A painting for our office', details: { size: '120x80' } },
    });
    expect(sent.statusCode).toBe(201);
    const bot = await ctx.app.inject({
      method: 'POST',
      url: '/public/inquiries',
      headers: host,
      payload: { kind: 'contact', name: 'Bot', email: 'bot@example.com', message: 'spam', website: 'http://spam.example' },
    });
    expect(bot.statusCode).toBe(201);

    const list = (await ctx.app.inject({ method: 'GET', url: '/inquiries', headers: seifu.auth })).json();
    expect(list.map((i: { name: string }) => i.name)).toEqual(['Abebe']);
    const theirs = (await ctx.app.inject({ method: 'GET', url: '/inquiries', headers: other.auth })).json();
    expect(theirs).toHaveLength(0);

    const overview = (await ctx.app.inject({ method: 'GET', url: '/overview', headers: seifu.auth })).json();
    expect(overview.views.at(-1).views).toBe(1);
    expect(overview.topPages[0]).toEqual({ path: '/about', views: 1 });
    expect(overview.inquiries.new).toBeGreaterThanOrEqual(1);
  });
});
