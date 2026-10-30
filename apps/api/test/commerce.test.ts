import crypto from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createPlatformAdmin, login, onboardTenant, publishArtwork, setupTestApp } from './helpers.js';

let ctx: Awaited<ReturnType<typeof setupTestApp>>;
let seifu: Awaited<ReturnType<typeof onboardTenant>>;
let other: Awaited<ReturnType<typeof onboardTenant>>;
const host = { 'x-tenant-host': 'seifu.platform.test' };
const buyer = { name: 'Hana Tesfaye', email: 'hana@example.com', phone: '+251911000000' };
const webhookSecret = 'whsec-seifu-123';

beforeAll(async () => {
  ctx = await setupTestApp();
  const admin = await createPlatformAdmin(ctx.db);
  const adminToken = (await login(ctx.app, admin.email, admin.password)).token;
  seifu = await onboardTenant(ctx.app, adminToken, 'seifu');
  other = await onboardTenant(ctx.app, adminToken, 'artist-b');
});
afterAll(() => ctx.close());

const checkout = (artworkSlug: string) =>
  ctx.app.inject({ method: 'POST', url: '/public/checkout', headers: host, payload: { artworkSlug, buyer, shipping: { city: 'Addis Ababa' } } });

describe('payments', () => {
  it('refuses checkout until the artist connects a payment account', async () => {
    await publishArtwork(ctx.app, seifu.auth, 'Green Cathedral', 260000, { discount: { type: 'fixed_price', value: 208000 } });
    const res = await checkout('green-cathedral');
    expect(res.statusCode).toBe(422);
    expect(res.json().error.code).toBe('payments_disabled');
  });

  it('stores payment keys encrypted and only shows a hint', async () => {
    const save = await ctx.app.inject({
      method: 'PUT',
      url: '/settings/payments',
      headers: seifu.auth,
      payload: { provider: 'chapa', secretKey: 'CHASECK_TEST-abcdefgh1234', webhookSecret },
    });
    expect(save.statusCode).toBe(204);
    const row = await ctx.db.selectFrom('tenant_secrets').select('ciphertext').executeTakeFirstOrThrow();
    expect(row.ciphertext).not.toContain('CHASECK');
    const settings = (await ctx.app.inject({ method: 'GET', url: '/settings/payments', headers: seifu.auth })).json();
    expect(settings).toMatchObject({ configured: true, testMode: true, keyHint: '…1234' });
    expect(settings.webhookUrl).toBe(`http://api.platform.test/payments/webhook/chapa/${seifu.tenant.id}`);
    const site = (await ctx.app.inject({ method: 'GET', url: '/public/site', headers: host })).json();
    expect(site.shop.paymentsEnabled).toBe(true);
  });

  let txRef: string;

  it('charges the discounted price from the catalog and holds the painting', async () => {
    const res = await checkout('green-cathedral');
    expect(res.statusCode).toBe(201);
    txRef = res.json().txRef;
    expect(res.json().checkoutUrl).toBe(`https://pay.test/checkout/${txRef}`);
    const req = ctx.payments.initialized.at(-1)!;
    expect(req.amountCents).toBe(208000);
    expect(req.returnUrl).toBe(`https://seifu.platform.test/payment/complete?tx_ref=${encodeURIComponent(txRef)}`);

    const second = await checkout('green-cathedral');
    expect(second.statusCode).toBe(409);
  });

  it('rejects webhooks with a bad signature', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: `/payments/webhook/chapa/${seifu.tenant.id}`,
      headers: { 'content-type': 'application/json', 'x-chapa-signature': 'nope' },
      payload: JSON.stringify({ tx_ref: txRef }),
    });
    expect(res.statusCode).toBe(401);
  });

  it('marks the order paid and the painting sold after a verified webhook, once', async () => {
    ctx.payments.results.set(txRef, { status: 'paid' });
    const body = JSON.stringify({ tx_ref: txRef, status: 'success' });
    const signature = crypto.createHmac('sha256', webhookSecret).update(body).digest('hex');
    for (let i = 0; i < 2; i++) {
      const res = await ctx.app.inject({
        method: 'POST',
        url: `/payments/webhook/chapa/${seifu.tenant.id}`,
        headers: { 'content-type': 'application/json', 'x-chapa-signature': signature },
        payload: body,
      });
      expect(res.statusCode).toBe(200);
    }
    const art = (await ctx.app.inject({ method: 'GET', url: '/public/artworks/green-cathedral', headers: host })).json();
    expect(art.sold).toBe(true);
    const orders = (await ctx.app.inject({ method: 'GET', url: '/orders', headers: seifu.auth })).json();
    expect(orders[0]).toMatchObject({ status: 'paid', amountCents: 208000, artworkTitle: 'Green Cathedral', buyer: { name: 'Hana Tesfaye' } });
    const payments = await ctx.db.selectFrom('payments').selectAll().execute();
    expect(payments).toHaveLength(1);

    const status = (await ctx.app.inject({ method: 'GET', url: `/public/orders/${txRef}`, headers: host })).json();
    expect(status).toMatchObject({ status: 'paid', artworkTitle: 'Green Cathedral' });
  });

  it('does not mark sold when the paid amount does not match', async () => {
    await publishArtwork(ctx.app, seifu.auth, 'Forest Light', 210000);
    const started = (await checkout('forest-light')).json();
    ctx.payments.results.set(started.txRef, { status: 'paid', amountCents: 100 });
    const status = (await ctx.app.inject({ method: 'GET', url: `/public/orders/${started.txRef}`, headers: host })).json();
    expect(status.status).toBe('failed');
    const art = (await ctx.app.inject({ method: 'GET', url: '/public/artworks/forest-light', headers: host })).json();
    expect(art.sold).toBe(false);
  });

  it('releases an expired hold so someone else can buy', async () => {
    await publishArtwork(ctx.app, seifu.auth, 'Quiet Clearing', 200000);
    expect((await checkout('quiet-clearing')).statusCode).toBe(201);
    await ctx.db.updateTable('orders').set({ hold_expires_at: new Date(Date.now() - 1000) }).where('artwork_title', '=', 'Quiet Clearing').execute();
    expect((await checkout('quiet-clearing')).statusCode).toBe(201);
  });

  it('releases the hold when the provider is down', async () => {
    await publishArtwork(ctx.app, seifu.auth, 'Falling Leaves', 180000);
    ctx.payments.failInitialize = true;
    expect((await checkout('falling-leaves')).statusCode).toBe(502);
    ctx.payments.failInitialize = false;
    expect((await checkout('falling-leaves')).statusCode).toBe(201);
  });

  it('takes commission deposits', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/public/checkout/deposit',
      headers: host,
      payload: { buyer, amountCents: 30000, note: 'Quote 2024-11' },
    });
    expect(res.statusCode).toBe(201);
    expect(ctx.payments.initialized.at(-1)!.description).toBe('Commission deposit');
  });

  it('only allows valid order status changes', async () => {
    const orders = (await ctx.app.inject({ method: 'GET', url: '/orders?status=paid', headers: seifu.auth })).json();
    const shipped = await ctx.app.inject({ method: 'PATCH', url: `/orders/${orders[0].id}`, headers: seifu.auth, payload: { status: 'shipped' } });
    expect(shipped.json().status).toBe('shipped');
    const pending = (await ctx.app.inject({ method: 'GET', url: '/orders?status=pending', headers: seifu.auth })).json();
    const bad = await ctx.app.inject({ method: 'PATCH', url: `/orders/${pending[0].id}`, headers: seifu.auth, payload: { status: 'shipped' } });
    expect(bad.statusCode).toBe(422);
  });

  it("keeps orders and webhooks scoped to their tenant", async () => {
    const theirs = (await ctx.app.inject({ method: 'GET', url: '/orders', headers: other.auth })).json();
    expect(theirs).toHaveLength(0);
    const seifuOrder = (await ctx.app.inject({ method: 'GET', url: '/orders', headers: seifu.auth })).json()[0];
    const patch = await ctx.app.inject({ method: 'PATCH', url: `/orders/${seifuOrder.id}`, headers: other.auth, payload: { note: 'x' } });
    expect(patch.statusCode).toBe(404);
    // A webhook for Seifu's order sent to the other tenant's URL is rejected (no keys there).
    const res = await ctx.app.inject({
      method: 'POST',
      url: `/payments/webhook/chapa/${other.tenant.id}`,
      headers: { 'content-type': 'application/json', 'x-chapa-signature': 'x' },
      payload: JSON.stringify({ tx_ref: txRef }),
    });
    expect(res.statusCode).toBe(401);
    const status = await ctx.app.inject({ method: 'GET', url: `/public/orders/${txRef}`, headers: { 'x-tenant-host': 'artist-b.platform.test' } });
    expect(status.statusCode).toBe(404);
  });

  it('lets only owners manage payment keys', async () => {
    await ctx.app.inject({
      method: 'POST',
      url: '/workspace/members',
      headers: seifu.auth,
      payload: { email: 'editor@seifu.test', name: 'Editor', role: 'editor', password: 'editor-password-1' },
    });
    const editor = await login(ctx.app, 'editor@seifu.test', 'editor-password-1');
    const res = await ctx.app.inject({ method: 'GET', url: '/settings/payments', headers: { authorization: `Bearer ${editor.token}` } });
    expect(res.statusCode).toBe(403);
  });
});
