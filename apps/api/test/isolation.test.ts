import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createPlatformAdmin, login, onboardTenant, setupTestApp } from './helpers.js';

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
});
