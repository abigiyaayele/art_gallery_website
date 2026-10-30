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

describe('auth', () => {
  it('rejects a wrong password with the same message as an unknown email', async () => {
    const wrong = await ctx.app.inject({ method: 'POST', url: '/auth/login', payload: { email: 'admin@platform.test', password: 'nope' } });
    const unknown = await ctx.app.inject({ method: 'POST', url: '/auth/login', payload: { email: 'who@platform.test', password: 'nope' } });
    expect(wrong.statusCode).toBe(401);
    expect(unknown.statusCode).toBe(401);
    expect(wrong.json().error.message).toBe(unknown.json().error.message);
  });

  it('signs an owner into their workspace and returns it in /auth/me', async () => {
    const { tenant, auth } = await onboardTenant(ctx.app, adminToken, 'alpha');
    const me = await ctx.app.inject({ method: 'GET', url: '/auth/me', headers: auth });
    expect(me.statusCode).toBe(200);
    expect(me.json().activeTenantId).toBe(tenant.id);
    expect(me.json().role).toBe('owner');
  });

  it('rotates refresh tokens so a used token stops working', async () => {
    const { refreshCookie } = await login(ctx.app, 'alpha@artists.test', 'alpha-password-123');
    const first = await ctx.app.inject({ method: 'POST', url: '/auth/refresh', cookies: { rt: refreshCookie! } });
    expect(first.statusCode).toBe(200);
    const again = await ctx.app.inject({ method: 'POST', url: '/auth/refresh', cookies: { rt: refreshCookie! } });
    expect(again.statusCode).toBe(401);
  });

  it('requires a token for protected routes', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/workspace' });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe('unauthorized');
  });

  it('lets a member of two workspaces switch between them', async () => {
    const beta = await onboardTenant(ctx.app, adminToken, 'beta');
    const alpha = await login(ctx.app, 'alpha@artists.test', 'alpha-password-123');
    await ctx.app.inject({
      method: 'POST',
      url: '/workspace/members',
      headers: { authorization: `Bearer ${beta.token}` },
      payload: { email: 'alpha@artists.test', name: 'Alpha', role: 'editor', password: 'unused-password-1' },
    });
    const switched = await ctx.app.inject({
      method: 'POST',
      url: '/auth/switch-tenant',
      headers: { authorization: `Bearer ${alpha.token}` },
      payload: { tenantId: beta.tenant.id },
    });
    expect(switched.statusCode).toBe(200);
    expect(switched.json().activeTenantId).toBe(beta.tenant.id);
    expect(switched.json().workspaces).toHaveLength(2);
  });
});
