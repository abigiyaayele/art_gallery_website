import { slug } from '@platform/contracts';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { publicCache, requestHost } from '../../../shared/http/public.js';
import { parse } from '../../../shared/http/validate.js';
import type { TenantResolver } from '../../tenancy/application/use-cases.js';
import type { PublicCatalog } from '../application/use-cases.js';

const listQuery = z.object({
  category: z.string().max(60).optional(),
  onSale: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  status: z.enum(['available', 'sold']).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export function publicCatalogRoutes(catalog: PublicCatalog, resolver: TenantResolver) {
  return async (app: FastifyInstance) => {
    app.get('/public/artworks', async (req, reply) => {
      const tenantId = await resolver.resolve(requestHost(req));
      publicCache(reply);
      return catalog.list(tenantId, parse(listQuery, req.query));
    });

    app.get('/public/artworks/:slug', async (req, reply) => {
      const tenantId = await resolver.resolve(requestHost(req));
      publicCache(reply);
      return catalog.get(tenantId, parse(z.object({ slug }), req.params).slug);
    });

    app.get('/public/categories', async (req, reply) => {
      const tenantId = await resolver.resolve(requestHost(req));
      publicCache(reply);
      return catalog.categories(tenantId);
    });
  };
}
