import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createPlatformAdmin, login, onboardTenant, setupTestApp } from './helpers.js';

let ctx: Awaited<ReturnType<typeof setupTestApp>>;
let adminToken: string;

beforeAll(async () => {
  ctx = await setupTestApp();
  const admin = await createPlatformAdmin(ctx.db);
  adminToken = (await login(ctx.app, admin.email, admin.password)).token;
});
afterAll(() => ctx.close());

describe('tenancy', () => {
  it('onboards a tenant with a platform subdomain', async () => {
    const { auth } = await onboardTenant(ctx.app, adminToken, 'seifu');
    const domains = await ctx.app.inject({ method: 'GET', url: '/workspace/domains', headers: auth });
    expect(domains.json()).toMatchObject([{ hostname: 'seifu.platform.test', isPrimary: true, isPlatformSubdomain: true }]);
  });

  it('only lets platform admins onboard tenants', async () => {
    const { auth } = await onboardTenant(ctx.app, adminToken, 'artist-b');
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/admin/tenants',
      headers: auth,
      payload: { name: 'X', slug: 'sneaky', owner: { email: 'x@x.test', name: 'X', password: 'password-1234' } },
    });
    expect(res.statusCode).toBe(403);
  });

  it('refuses reserved and duplicate slugs', async () => {
    const reserved = await ctx.app.inject({
      method: 'POST',
      url: '/admin/tenants',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { name: 'X', slug: 'admin', owner: { email: 'y@x.test', name: 'Y', password: 'password-1234' } },
    });
    expect(reserved.statusCode).toBe(422);
    const dup = await ctx.app.inject({
      method: 'POST',
      url: '/admin/tenants',
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { name: 'X', slug: 'seifu', owner: { email: 'z@x.test', name: 'Z', password: 'password-1234' } },
    });
    expect(dup.statusCode).toBe(409);
  });

  it('connects a custom domain and keeps it unique across tenants', async () => {
    const owner = await login(ctx.app, 'seifu@artists.test', 'seifu-password-123');
    const auth = { authorization: `Bearer ${owner.token}` };
    const added = await ctx.app.inject({ method: 'POST', url: '/workspace/domains', headers: auth, payload: { hostname: 'SeifuArts.com' } });
    expect(added.statusCode).toBe(201);
    expect(added.json().hostname).toBe('seifuarts.com');

    const other = await login(ctx.app, 'artist-b@artists.test', 'artist-b-password-123');
    const taken = await ctx.app.inject({
      method: 'POST',
      url: '/workspace/domains',
      headers: { authorization: `Bearer ${other.token}` },
      payload: { hostname: 'seifuarts.com' },
    });
    expect(taken.statusCode).toBe(409);
  });
});
