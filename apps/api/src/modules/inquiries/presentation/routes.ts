import { inquiryInput, updateInquiryInput, uuid } from '@platform/contracts';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireActor } from '../../../shared/http/auth.js';
import { requestHost } from '../../../shared/http/public.js';
import { parse } from '../../../shared/http/validate.js';
import type { TenantResolver } from '../../tenancy/application/use-cases.js';
import type { ListInquiries, SubmitInquiry, UpdateInquiry } from '../application/use-cases.js';

export interface InquiryUseCases {
  submit: SubmitInquiry;
  list: ListInquiries;
  update: UpdateInquiry;
}

export function inquiryRoutes(uc: InquiryUseCases, resolver: TenantResolver) {
  return async (app: FastifyInstance) => {
    app.post('/public/inquiries', { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }, async (req, reply) => {
      const tenantId = await resolver.resolve(requestHost(req));
      await uc.submit.execute(tenantId, parse(inquiryInput, req.body));
      return reply.status(201).send({ ok: true });
    });
    app.get('/inquiries', async req => {
      const { status } = parse(z.object({ status: z.enum(['new', 'replied', 'archived']).optional() }), req.query);
      return uc.list.execute(requireActor(req), status);
    });
    app.patch('/inquiries/:id', async (req, reply) => {
      const { id } = parse(z.object({ id: uuid }), req.params);
      await uc.update.execute(requireActor(req), id, parse(updateInquiryInput, req.body).status);
      return reply.status(204).send();
    });
  };
}
