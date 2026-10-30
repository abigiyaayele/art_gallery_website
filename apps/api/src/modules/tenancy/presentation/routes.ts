import { addDomainInput, onboardTenantInput, uuid } from '@platform/contracts';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireActor } from '../../../shared/http/auth.js';
import { parse } from '../../../shared/http/validate.js';
import type {
  AddDomain,
  GetCurrentTenant,
  ListDomains,
  ListTenants,
  OnboardTenant,
  RemoveDomain,
  SetTenantStatus,
} from '../application/use-cases.js';

export interface TenancyUseCases {
  onboard: OnboardTenant;
  listTenants: ListTenants;
  setStatus: SetTenantStatus;
  current: GetCurrentTenant;
  listDomains: ListDomains;
  addDomain: AddDomain;
  removeDomain: RemoveDomain;
}

export function tenancyRoutes(uc: TenancyUseCases) {
  return async (app: FastifyInstance) => {
    // Platform admin
    app.get('/admin/tenants', async req => uc.listTenants.execute(requireActor(req)));
    app.post('/admin/tenants', async (req, reply) => {
      const tenant = await uc.onboard.execute(requireActor(req), parse(onboardTenantInput, req.body));
      return reply.status(201).send(tenant);
    });
    app.patch('/admin/tenants/:id', async (req, reply) => {
      const { id } = parse(z.object({ id: uuid }), req.params);
      const { status } = parse(z.object({ status: z.enum(['active', 'suspended']) }), req.body);
      await uc.setStatus.execute(requireActor(req), id, status);
      return reply.status(204).send();
    });

    // Current workspace
    app.get('/workspace', async req => uc.current.execute(requireActor(req)));
    app.get('/workspace/domains', async req => uc.listDomains.execute(requireActor(req)));
    app.post('/workspace/domains', async (req, reply) => {
      const domain = await uc.addDomain.execute(requireActor(req), parse(addDomainInput, req.body));
      return reply.status(201).send(domain);
    });
    app.delete('/workspace/domains/:id', async (req, reply) => {
      const { id } = parse(z.object({ id: uuid }), req.params);
      await uc.removeDomain.execute(requireActor(req), id);
      return reply.status(204).send();
    });
  };
}
