import type {
  CheckoutInput,
  CheckoutStarted,
  DepositInput,
  OrderDto,
  OrderStatus,
  PaymentSettingsDto,
  PaymentSettingsInput,
  PublicOrderStatus,
} from '@platform/contracts';
import { assertCan } from '../../../shared/auth/policy.js';
import type { Actor } from '../../../shared/context.js';
import type { SecretBox } from '../../../shared/crypto/secret-box.js';
import { ConflictError, DomainError, NotFoundError, UnauthorizedError, UpstreamError } from '../../../shared/errors.js';
import { assertTransition, newTxRef, splitName } from '../domain/order.js';
import {
  HoldConflict,
  type CommerceCatalog,
  type OrderRecord,
  type OrderRepository,
  type PaymentProvider,
  type ProviderCredentials,
  type SecretStore,
  type TenantDirectory,
} from './ports.js';

export const HOLD_MINUTES = 15;
const SECRET_NAME = 'payments.chapa';

const toDto = ({ tenantId: _t, ...dto }: OrderRecord): OrderDto => dto;

/** Loads and stores a tenant's payment credentials, encrypted at rest. */
export class PaymentCredentials {
  constructor(
    private readonly secrets: SecretStore,
    private readonly box: SecretBox,
  ) {}

  async get(tenantId: string): Promise<ProviderCredentials | undefined> {
    if (!this.box.available) return undefined;
    const sealed = await this.secrets.get(tenantId, SECRET_NAME);
    return sealed ? (JSON.parse(this.box.open(sealed)) as ProviderCredentials) : undefined;
  }

  async set(tenantId: string, creds: ProviderCredentials) {
    if (!this.box.available) throw new DomainError('encryption_unavailable', 'The platform is not set up to store payment keys yet');
    await this.secrets.set(tenantId, SECRET_NAME, this.box.seal(JSON.stringify(creds)));
  }

  remove(tenantId: string) {
    return this.secrets.delete(tenantId, SECRET_NAME);
  }

  async enabled(tenantId: string) {
    return !!(await this.get(tenantId));
  }
}

export interface CheckoutUrls {
  siteUrl(host: string): string;
  webhookUrl(tenantId: string): string;
}

class CheckoutService {
  constructor(
    readonly orders: OrderRepository,
    readonly provider: PaymentProvider,
    readonly credentials: PaymentCredentials,
    readonly catalog: CommerceCatalog,
    readonly tenants: TenantDirectory,
    readonly urls: CheckoutUrls,
  ) {}

  async creds(tenantId: string) {
    const creds = await this.credentials.get(tenantId);
    if (!creds) throw new DomainError('payments_disabled', 'Online payment is not available for this artist yet. Please send an inquiry instead.');
    return creds;
  }

  async start(order: OrderRecord, creds: ProviderCredentials, title: string, description: string): Promise<CheckoutStarted> {
    const tenant = await this.tenants.info(order.tenantId);
    if (!tenant) throw new NotFoundError('Site');
    const { firstName, lastName } = splitName(order.buyer.name);
    try {
      const { checkoutUrl } = await this.provider.initialize(creds, {
        txRef: order.txRef,
        amountCents: order.amountCents,
        currency: order.currency,
        email: order.buyer.email,
        firstName,
        lastName,
        phone: order.buyer.phone,
        title,
        description,
        returnUrl: `${this.urls.siteUrl(tenant.primaryHost)}/payment/complete?tx_ref=${encodeURIComponent(order.txRef)}`,
        callbackUrl: this.urls.webhookUrl(order.tenantId),
      });
      return { orderId: order.id, txRef: order.txRef, checkoutUrl, holdExpiresAt: order.holdExpiresAt };
    } catch (err) {
      // Release the hold so the painting can be bought again.
      await this.orders.setStatus(order.tenantId, order.id, 'failed');
      throw new UpstreamError('Could not start the payment. Please try again.', err instanceof Error ? err.message : undefined);
    }
  }
}

export function createCheckoutService(...args: ConstructorParameters<typeof CheckoutService>) {
  return new CheckoutService(...args);
}
type Svc = CheckoutService;

/** Buyer starts paying for a painting; the painting is held for HOLD_MINUTES. */
export class StartArtworkCheckout {
  constructor(private readonly s: Svc) {}

  async execute(tenantId: string, input: CheckoutInput, now = new Date()): Promise<CheckoutStarted> {
    const creds = await this.s.creds(tenantId);
    const artwork = await this.s.catalog.findForSale(tenantId, input.artworkSlug);
    if (!artwork) throw new NotFoundError('Artwork');
    if (artwork.status !== 'available' || artwork.effectiveCents === null) {
      throw new DomainError('not_for_sale', 'This painting is not available to buy');
    }
    const tenant = await this.s.tenants.info(tenantId);
    await this.s.orders.expireStaleHolds(tenantId, now);
    let order: OrderRecord;
    try {
      order = await this.s.orders.create({
        tenantId,
        kind: 'artwork',
        artworkId: artwork.id,
        artworkTitle: artwork.title,
        // The price always comes from the catalog, never from the browser.
        amountCents: artwork.effectiveCents,
        currency: artwork.currency,
        buyer: input.buyer,
        shipping: input.shipping,
        note: input.note,
        txRef: newTxRef(tenant?.slug ?? 'order'),
        holdExpiresAt: new Date(now.getTime() + HOLD_MINUTES * 60_000),
      });
    } catch (err) {
      if (err instanceof HoldConflict) throw new ConflictError('Someone is buying this painting right now. Please try again in a few minutes.');
      throw err;
    }
    return this.s.start(order, creds, tenant?.name ?? 'Artwork', artwork.title);
  }
}

export class StartDepositCheckout {
  constructor(private readonly s: Svc) {}

  async execute(tenantId: string, input: DepositInput): Promise<CheckoutStarted> {
    const creds = await this.s.creds(tenantId);
    const tenant = await this.s.tenants.info(tenantId);
    const order = await this.s.orders.create({
      tenantId,
      kind: 'deposit',
      artworkId: null,
      artworkTitle: '',
      amountCents: input.amountCents,
      currency: input.currency,
      buyer: input.buyer,
      shipping: {},
      note: input.note,
      txRef: newTxRef(tenant?.slug ?? 'deposit'),
      holdExpiresAt: null,
    });
    return this.s.start(order, creds, tenant?.name ?? 'Commission', 'Commission deposit');
  }
}

/**
 * Settles a pending order by asking the provider directly (never trusting a
 * webhook body or a redirect). Safe to call many times.
 */
export class ConfirmPayment {
  constructor(private readonly s: Svc) {}

  async execute(tenantId: string, txRef: string): Promise<OrderRecord> {
    const order = await this.s.orders.findByTxRef(tenantId, txRef);
    if (!order) throw new NotFoundError('Order');
    if (order.status !== 'pending') return order;
    const creds = await this.s.creds(tenantId);
    const result = await this.s.provider.verify(creds, txRef);
    if (result.status === 'pending') return order;

    const matches = result.amountCents === order.amountCents && result.currency.toUpperCase() === order.currency;
    const paid = result.status === 'paid' && matches;
    await this.s.orders.recordPayment({
      tenantId,
      orderId: order.id,
      provider: this.s.provider.name,
      reference: result.reference,
      status: paid ? 'paid' : result.status === 'paid' ? 'amount_mismatch' : 'failed',
      raw: result.raw,
      verified: true,
    });
    if (paid) {
      await this.s.orders.setStatus(tenantId, order.id, 'paid', { paidAt: new Date() });
      if (order.artworkId) await this.s.catalog.recordSale(tenantId, order.artworkId);
    } else {
      await this.s.orders.setStatus(tenantId, order.id, 'failed');
    }
    return (await this.s.orders.findByTxRef(tenantId, txRef))!;
  }
}

export class HandlePaymentWebhook {
  constructor(
    private readonly s: Svc,
    private readonly confirm: ConfirmPayment,
  ) {}

  async execute(tenantId: string, rawBody: Buffer, body: unknown, headers: Record<string, string | string[] | undefined>) {
    const creds = await this.s.credentials.get(tenantId);
    if (!creds || !this.s.provider.isValidWebhook(creds, rawBody, headers)) throw new UnauthorizedError('Invalid webhook signature');
    const txRef = this.s.provider.webhookTxRef(body);
    if (txRef) await this.confirm.execute(tenantId, txRef).catch(err => (err instanceof NotFoundError ? undefined : Promise.reject(err)));
  }
}

export class GetPublicOrderStatus {
  constructor(private readonly confirm: ConfirmPayment) {}

  async execute(tenantId: string, txRef: string): Promise<PublicOrderStatus> {
    const o = await this.confirm.execute(tenantId, txRef);
    return { status: o.status, kind: o.kind, amountCents: o.amountCents, currency: o.currency, artworkTitle: o.artworkTitle };
  }
}

export class ListOrders {
  constructor(private readonly orders: OrderRepository) {}

  async execute(actor: Actor, status?: OrderStatus) {
    assertCan(actor, 'orders:manage');
    await this.orders.expireStaleHolds(actor.tenantId, new Date());
    return (await this.orders.list(actor.tenantId, status)).map(toDto);
  }
}

export class UpdateOrder {
  constructor(private readonly orders: OrderRepository) {}

  async execute(actor: Actor, id: string, input: { status?: 'shipped' | 'refunded'; note?: string }) {
    assertCan(actor, 'orders:manage');
    const order = await this.orders.find(actor.tenantId, id);
    if (!order) throw new NotFoundError('Order');
    if (input.status) {
      assertTransition(order.status, input.status);
      await this.orders.setStatus(actor.tenantId, id, input.status);
    }
    if (input.note !== undefined) await this.orders.updateNote(actor.tenantId, id, input.note);
    return toDto((await this.orders.find(actor.tenantId, id))!);
  }
}

export class GetPaymentSettings {
  constructor(
    private readonly credentials: PaymentCredentials,
    private readonly urls: CheckoutUrls,
  ) {}

  async execute(actor: Actor): Promise<PaymentSettingsDto> {
    assertCan(actor, 'payments:manage');
    const creds = await this.credentials.get(actor.tenantId);
    return {
      provider: creds ? 'chapa' : null,
      configured: !!creds,
      testMode: !!creds?.secretKey.includes('TEST'),
      keyHint: creds ? `…${creds.secretKey.slice(-4)}` : null,
      webhookUrl: this.urls.webhookUrl(actor.tenantId),
    };
  }
}

export class SavePaymentSettings {
  constructor(private readonly credentials: PaymentCredentials) {}

  async execute(actor: Actor, input: PaymentSettingsInput) {
    assertCan(actor, 'payments:manage');
    await this.credentials.set(actor.tenantId, { secretKey: input.secretKey, webhookSecret: input.webhookSecret });
  }
}

export class RemovePaymentSettings {
  constructor(private readonly credentials: PaymentCredentials) {}

  async execute(actor: Actor) {
    assertCan(actor, 'payments:manage');
    await this.credentials.remove(actor.tenantId);
  }
}
