import { checkoutInput, depositInput, orderStatuses, paymentSettingsInput, updateOrderInput, uuid } from '@platform/contracts';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireActor } from '../../../shared/http/auth.js';
import { requestHost } from '../../../shared/http/public.js';
import { parse } from '../../../shared/http/validate.js';
import type { TenantResolver } from '../../tenancy/application/use-cases.js';
import type {
  GetPaymentSettings,
  GetPublicOrderStatus,
  HandlePaymentWebhook,
  ListOrders,
  RemovePaymentSettings,
  SavePaymentSettings,
  StartArtworkCheckout,
  StartDepositCheckout,
  UpdateOrder,
} from '../application/use-cases.js';

export interface CommerceUseCases {
  checkout: StartArtworkCheckout;
  deposit: StartDepositCheckout;
  webhook: HandlePaymentWebhook;
  publicStatus: GetPublicOrderStatus;
  listOrders: ListOrders;
  updateOrder: UpdateOrder;
  getPaymentSettings: GetPaymentSettings;
  savePaymentSettings: SavePaymentSettings;
  removePaymentSettings: RemovePaymentSettings;
}

declare module 'fastify' {
  interface FastifyRequest {
    rawBody?: Buffer;
  }
}

export function commerceRoutes(uc: CommerceUseCases, resolver: TenantResolver) {
  return async (app: FastifyInstance) => {
    const checkoutLimit = { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } };

    app.post('/public/checkout', checkoutLimit, async (req, reply) => {
      const tenantId = await resolver.resolve(requestHost(req));
      return reply.status(201).send(await uc.checkout.execute(tenantId, parse(checkoutInput, req.body)));
    });
    app.post('/public/checkout/deposit', checkoutLimit, async (req, reply) => {
      const tenantId = await resolver.resolve(requestHost(req));
      return reply.status(201).send(await uc.deposit.execute(tenantId, parse(depositInput, req.body)));
    });
    app.get('/public/orders/:txRef', async req => {
      const tenantId = await resolver.resolve(requestHost(req));
      const { txRef } = parse(z.object({ txRef: z.string().min(1).max(100) }), req.params);
      return uc.publicStatus.execute(tenantId, txRef);
    });

    // The webhook needs the exact raw body to check the signature, so it gets its own JSON parser.
    await app.register(async scoped => {
      scoped.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, body, done) => {
        req.rawBody = body as Buffer;
        try {
          done(null, body.length ? JSON.parse(body.toString('utf8')) : {});
        } catch (err) {
          done(err as Error, undefined);
        }
      });
      scoped.post('/payments/webhook/chapa/:tenantId', async (req, reply) => {
        const { tenantId } = parse(z.object({ tenantId: uuid }), req.params);
        await uc.webhook.execute(tenantId, req.rawBody ?? Buffer.alloc(0), req.body, req.headers);
        return reply.status(200).send({ ok: true });
      });
    });

    app.get('/orders', async req => {
      const { status } = parse(z.object({ status: z.enum(orderStatuses).optional() }), req.query);
      return uc.listOrders.execute(requireActor(req), status);
    });
    app.patch('/orders/:id', async req => {
      const { id } = parse(z.object({ id: uuid }), req.params);
      return uc.updateOrder.execute(requireActor(req), id, parse(updateOrderInput, req.body));
    });

    app.get('/settings/payments', async req => uc.getPaymentSettings.execute(requireActor(req)));
    app.put('/settings/payments', async (req, reply) => {
      await uc.savePaymentSettings.execute(requireActor(req), parse(paymentSettingsInput, req.body));
      return reply.status(204).send();
    });
    app.delete('/settings/payments', async (req, reply) => {
      await uc.removePaymentSettings.execute(requireActor(req));
      return reply.status(204).send();
    });
  };
}
