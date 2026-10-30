import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createPlatformAdmin, login, onboardTenant, setupTestApp, uploadImage } from './helpers.js';

/**
 * Tenant isolation: with tenant A's token, every attempt to read or change
 * tenant B's records must fail as if the record did not exist.
 * Each module adds its endpoints here as it lands.
 */
let ctx: Awaited<ReturnType<typeof setupTestApp>>;
let a: Awaited<ReturnType<typeof onboardTenant>>;
let b: Awaited<ReturnType<typeof onboardTenant>>;

beforeAll(async () => {
  ctx = await setupTestApp();
  const admin = await createPlatformAdmin(ctx.db);
  const adminToken = (await login(ctx.app, admin.email, admin.password)).token;
  a = await onboardTenant(ctx.app, adminToken, 'tenant-a');
  b = await onboardTenant(ctx.app, adminToken, 'tenant-b');
});
afterAll(() => ctx.close());

describe('tenant isolation', () => {
  it('cannot switch into a workspace it is not a member of', async () => {
    const res = await ctx.app.inject({ method: 'POST', url: '/auth/switch-tenant', headers: a.auth, payload: { tenantId: b.tenant.id } });
    expect(res.statusCode).toBe(403);
  });

  it("cannot see or remove another tenant's domains", async () => {
    const bDomains = (await ctx.app.inject({ method: 'GET', url: '/workspace/domains', headers: b.auth })).json();
    const del = await ctx.app.inject({ method: 'DELETE', url: `/workspace/domains/${bDomains[0].id}`, headers: a.auth });
    expect(del.statusCode).toBe(404);
  });

  it("cannot remove another tenant's members", async () => {
    const bMembers = (await ctx.app.inject({ method: 'GET', url: '/workspace/members', headers: b.auth })).json();
    const del = await ctx.app.inject({ method: 'DELETE', url: `/workspace/members/${bMembers[0].userId}`, headers: a.auth });
    expect(del.statusCode).toBe(404);
  });

  describe('catalog and media', () => {
    let bImage: string;
    let bArtwork: string;

    beforeAll(async () => {
      bImage = (await uploadImage(ctx.app, b.auth)).json().id;
      const created = await ctx.app.inject({
        method: 'POST',
        url: '/artworks',
        headers: b.auth,
        payload: { title: 'B painting', priceCents: 5000, imageIds: [bImage] },
      });
      bArtwork = created.json().id;
      await ctx.app.inject({ method: 'POST', url: `/artworks/${bArtwork}/publish`, headers: b.auth });
    });

    it.each([
      ['GET', () => `/artworks/${bArtwork}`],
      ['PATCH', () => `/artworks/${bArtwork}`],
      ['DELETE', () => `/artworks/${bArtwork}`],
      ['POST', () => `/artworks/${bArtwork}/mark-sold`],
      ['PATCH', () => `/media/${bImage}`],
      ['DELETE', () => `/media/${bImage}`],
    ] as const)("cannot %s tenant B's record", async (method, url) => {
      const res = await ctx.app.inject({ method, url: url(), headers: a.auth, payload: method === 'PATCH' ? { altText: 'x', title: 'x' } : undefined });
      expect(res.statusCode).toBe(404);
    });

    it("cannot attach tenant B's image to its own artwork", async () => {
      const res = await ctx.app.inject({ method: 'POST', url: '/artworks', headers: a.auth, payload: { title: 'Stolen', imageIds: [bImage] } });
      expect(res.statusCode).toBe(400);
    });

    it("never lists tenant B's work in its own dashboard or public site", async () => {
      const own = (await ctx.app.inject({ method: 'GET', url: '/artworks', headers: a.auth })).json();
      expect(own.items).toHaveLength(0);
      const site = (await ctx.app.inject({ method: 'GET', url: '/public/artworks', headers: { 'x-tenant-host': 'tenant-a.platform.test' } })).json();
      expect(site.items).toHaveLength(0);
      const media = (await ctx.app.inject({ method: 'GET', url: '/media', headers: a.auth })).json();
      expect(media).toHaveLength(0);
    });

    it("cannot use a bulk action on tenant B's artworks", async () => {
      const res = await ctx.app.inject({ method: 'POST', url: '/artworks/bulk', headers: a.auth, payload: { ids: [bArtwork], action: 'delete' } });
      expect(res.json()).toMatchObject({ updated: 0, failed: [{ id: bArtwork, message: 'Not found' }] });
      const still = await ctx.app.inject({ method: 'GET', url: `/artworks/${bArtwork}`, headers: b.auth });
      expect(still.statusCode).toBe(200);
    });
  });
});
