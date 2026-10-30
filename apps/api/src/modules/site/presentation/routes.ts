import { pageSlugSchema, profileInput, sitePageInput, siteSettingsInput } from '@platform/contracts';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireActor } from '../../../shared/http/auth.js';
import { publicCache, requestHost } from '../../../shared/http/public.js';
import { parse } from '../../../shared/http/validate.js';
import type { TenantResolver } from '../../tenancy/application/use-cases.js';
import type { GetProfile, GetPublicSite, GetSiteSettings, ListPages, SavePage, UpdateProfile, UpdateSiteSettings } from '../application/use-cases.js';

export interface SiteUseCases {
  getProfile: GetProfile;
  updateProfile: UpdateProfile;
  getSettings: GetSiteSettings;
  updateSettings: UpdateSiteSettings;
  listPages: ListPages;
  savePage: SavePage;
  publicSite: GetPublicSite;
}

export function siteRoutes(uc: SiteUseCases, resolver: TenantResolver) {
  return async (app: FastifyInstance) => {
    app.get('/site/profile', async req => uc.getProfile.execute(requireActor(req)));
    app.put('/site/profile', async (req, reply) => {
      await uc.updateProfile.execute(requireActor(req), parse(profileInput, req.body));
      return reply.status(204).send();
    });
    app.get('/site/settings', async req => uc.getSettings.execute(requireActor(req)));
    app.put('/site/settings', async (req, reply) => {
      await uc.updateSettings.execute(requireActor(req), parse(siteSettingsInput, req.body));
      return reply.status(204).send();
    });
    app.get('/site/pages', async req => uc.listPages.execute(requireActor(req)));
    app.put('/site/pages/:slug', async (req, reply) => {
      const { slug } = parse(z.object({ slug: pageSlugSchema }), req.params);
      await uc.savePage.execute(requireActor(req), slug, parse(sitePageInput, req.body));
      return reply.status(204).send();
    });

    app.get('/public/site', async (req, reply) => {
      const tenantId = await resolver.resolve(requestHost(req));
      publicCache(reply);
      return uc.publicSite.execute(tenantId);
    });
  };
}
