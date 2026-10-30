import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createPlatformAdmin, login, onboardTenant, publishArtwork, setupTestApp } from './helpers.js';

let ctx: Awaited<ReturnType<typeof setupTestApp>>;
let seifu: Awaited<ReturnType<typeof onboardTenant>>;
let other: Awaited<ReturnType<typeof onboardTenant>>;

const copy = {
  titles: ['Forest Procession', 'Walking Home', 'Under the Canopy'],
  description: 'Women in white walk beneath a canopy of leaves.',
  story: 'I painted this after a walk to the market in the rain.',
  tags: ['forest', 'ethiopian art', 'women'],
  seoDescription: 'An original forest painting by Seifu.',
};

beforeAll(async () => {
  ctx = await setupTestApp();
  const admin = await createPlatformAdmin(ctx.db);
  const adminToken = (await login(ctx.app, admin.email, admin.password)).token;
  seifu = await onboardTenant(ctx.app, adminToken, 'seifu');
  other = await onboardTenant(ctx.app, adminToken, 'artist-b');
});
afterAll(() => ctx.close());

describe('AI assistant', () => {
  it('drafts artwork copy from the image and only this artist’s data, without changing the artwork', async () => {
    const art = await publishArtwork(ctx.app, seifu.auth, 'Untitled 7', 120000, { collection: 'Forest' });
    await publishArtwork(ctx.app, other.auth, 'Secret Harbour', 50000, { collection: 'Sea' });
    ctx.ai.replies.push(JSON.stringify(copy));

    const res = await ctx.app.inject({ method: 'POST', url: `/ai/artworks/${art.id}/copy`, headers: seifu.auth, payload: { tone: 'poetic' } });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ kind: 'artwork_copy', status: 'pending', artworkId: art.id, output: copy });

    const req = ctx.ai.requests.at(-1)!;
    expect(req.schema).toBeDefined();
    expect(req.messages[0]!.images?.[0]?.mediaType).toBe('image/webp');
    expect(req.system).toContain('Untitled 7');
    expect(req.system).not.toContain('Secret Harbour');

    const unchanged = await ctx.app.inject({ method: 'GET', url: `/artworks/${art.id}`, headers: seifu.auth });
    expect(unchanged.json().title).toBe('Untitled 7');
  });

  it('applies only what the artist picks, once', async () => {
    const [s] = (await ctx.app.inject({ method: 'GET', url: '/ai/suggestions?kind=artwork_copy', headers: seifu.auth })).json();
    const apply = await ctx.app.inject({ method: 'POST', url: `/ai/suggestions/${s.id}/apply`, headers: seifu.auth, payload: { title: copy.titles[1], story: copy.story } });
    expect(apply.statusCode).toBe(200);
    expect(apply.json()).toMatchObject({ title: 'Walking Home', story: copy.story, description: '' });

    const again = await ctx.app.inject({ method: 'POST', url: `/ai/suggestions/${s.id}/apply`, headers: seifu.auth, payload: { title: 'X' } });
    expect(again.statusCode).toBe(422);
  });

  it('keeps suggestions and goals private to each workspace', async () => {
    const [s] = (await ctx.app.inject({ method: 'GET', url: '/ai/suggestions', headers: seifu.auth })).json();
    const steal = await ctx.app.inject({ method: 'POST', url: `/ai/suggestions/${s.id}/dismiss`, headers: other.auth });
    expect(steal.statusCode).toBe(404);
    expect((await ctx.app.inject({ method: 'GET', url: '/ai/suggestions', headers: other.auth })).json()).toEqual([]);

    const goal = await ctx.app.inject({ method: 'POST', url: '/goals', headers: seifu.auth, payload: { title: 'Sell 10 paintings', target: 10, current: 2, unit: 'paintings', dueDate: '2026-12-31' } });
    expect(goal.statusCode).toBe(201);
    expect(goal.json()).toMatchObject({ dueDate: '2026-12-31', status: 'active' });
    const otherEdit = await ctx.app.inject({ method: 'PUT', url: `/goals/${goal.json().id}`, headers: other.auth, payload: { title: 'Mine now' } });
    expect(otherEdit.statusCode).toBe(404);
  });

  it('chats with goals in the briefing and records token usage', async () => {
    ctx.ai.replies.push('Paint two more forest pieces this month.');
    const res = await ctx.app.inject({ method: 'POST', url: '/ai/chat', headers: seifu.auth, payload: { messages: [{ role: 'user', content: 'What should I paint next?' }] } });
    expect(res.json().reply).toContain('forest');
    expect(ctx.ai.requests.at(-1)!.system).toContain('Sell 10 paintings');

    const usage = (await ctx.app.inject({ method: 'GET', url: '/ai/usage', headers: seifu.auth })).json();
    expect(usage).toMatchObject({ configured: true, usedTokens: 3000, limitTokens: 200000 });
    expect((await ctx.app.inject({ method: 'GET', url: '/ai/usage', headers: other.auth })).json().usedTokens).toBe(0);
  });

  it('stops at the monthly allowance', async () => {
    await ctx.db.updateTable('tenants').set({ ai_monthly_token_limit: 3000 }).where('slug', '=', 'seifu').execute();
    const calls = ctx.ai.requests.length;
    const res = await ctx.app.inject({ method: 'POST', url: '/ai/ideas', headers: seifu.auth, payload: { count: 3 } });
    expect(res.statusCode).toBe(429);
    expect(ctx.ai.requests.length).toBe(calls);
    await ctx.db.updateTable('tenants').set({ ai_monthly_token_limit: 200000 }).where('slug', '=', 'seifu').execute();
  });

  it('writes a weekly summary into the journal from this week’s entries', async () => {
    await ctx.app.inject({ method: 'POST', url: '/journal', headers: seifu.auth, payload: { body: 'Finished the underpainting for the cranes.' } });
    ctx.ai.replies.push('A steady week: the cranes are underway.');
    const res = await ctx.app.inject({ method: 'POST', url: '/journal/weekly-summary', headers: seifu.auth });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ kind: 'summary', body: 'A steady week: the cranes are underway.' });
    expect(ctx.ai.requests.at(-1)!.messages[0]!.text).toContain('underpainting for the cranes');
    expect((await ctx.app.inject({ method: 'GET', url: '/journal', headers: other.auth })).json()).toEqual([]);
  });

  it('says plainly when the assistant is not set up', async () => {
    ctx.ai.configured = false;
    const res = await ctx.app.inject({ method: 'POST', url: '/ai/chat', headers: seifu.auth, payload: { messages: [{ role: 'user', content: 'hi' }] } });
    expect(res.statusCode).toBe(422);
    expect(res.json().error.code).toBe('ai_not_configured');
    ctx.ai.configured = true;
  });
});
