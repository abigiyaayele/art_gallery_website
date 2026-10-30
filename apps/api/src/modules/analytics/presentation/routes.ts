import { pageViewInput } from '@platform/contracts';
import type { FastifyInstance } from 'fastify';
import { requireActor } from '../../../shared/http/auth.js';
import { requestHost } from '../../../shared/http/public.js';
import { parse } from '../../../shared/http/validate.js';
import type { TenantResolver } from '../../tenancy/application/use-cases.js';
import type { GetOverview, RecordPageView } from '../application/use-cases.js';

export function analyticsRoutes(uc: { recordView: RecordPageView; overview: GetOverview }, resolver: TenantResolver) {
  return async (app: FastifyInstance) => {
    app.post('/public/views', { config: { rateLimit: { max: 60, timeWindow: '1 minute' } } }, async (req, reply) => {
      const tenantId = await resolver.resolve(requestHost(req));
      await uc.recordView.execute(tenantId, parse(pageViewInput, req.body).path);
      return reply.status(204).send();
    });
    app.get('/overview', async req => uc.overview.execute(requireActor(req)));
  };
}
