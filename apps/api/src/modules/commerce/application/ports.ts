import type { OrderDto, OrderStatus } from '@platform/contracts';

export interface ProviderCredentials {
  secretKey: string;
  webhookSecret: string;
}

export interface InitializeRequest {
  txRef: string;
  amountCents: number;
  currency: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  title: string;
  description: string;
  returnUrl: string;
  callbackUrl: string;
}

export interface VerifiedPayment {
  status: 'paid' | 'failed' | 'pending';
  amountCents: number;
  currency: string;
  reference: string;
  raw: unknown;
}

/** Provider-independent payments; Chapa today, others are one more adapter. */
export interface PaymentProvider {
  readonly name: string;
  initialize(creds: ProviderCredentials, req: InitializeRequest): Promise<{ checkoutUrl: string }>;
  verify(creds: ProviderCredentials, txRef: string): Promise<VerifiedPayment>;
  isValidWebhook(creds: ProviderCredentials, rawBody: Buffer, headers: Record<string, string | string[] | undefined>): boolean;
  webhookTxRef(body: unknown): string | undefined;
}

export interface NewOrder {
  tenantId: string;
  kind: 'artwork' | 'deposit';
  artworkId: string | null;
  artworkTitle: string;
  amountCents: number;
  currency: string;
  buyer: { name: string; email: string; phone: string };
  shipping: Record<string, string>;
  note: string;
  txRef: string;
  holdExpiresAt: Date | null;
}

export interface OrderRecord extends OrderDto {
  tenantId: string;
}

export interface OrderRepository {
  /** Throws HoldConflict when another checkout already holds the artwork. */
  create(order: NewOrder): Promise<OrderRecord>;
  findByTxRef(tenantId: string, txRef: string): Promise<OrderRecord | undefined>;
  find(tenantId: string, id: string): Promise<OrderRecord | undefined>;
  list(tenantId: string, status?: OrderStatus): Promise<OrderRecord[]>;
  setStatus(tenantId: string, id: string, status: OrderStatus, extra?: { paidAt?: Date; note?: string }): Promise<void>;
  updateNote(tenantId: string, id: string, note: string): Promise<void>;
  expireStaleHolds(tenantId: string, now: Date): Promise<void>;
  recordPayment(p: { tenantId: string; orderId: string; provider: string; reference: string; status: string; raw: unknown; verified: boolean }): Promise<void>;
}

export class HoldConflict extends Error {}

export interface SecretStore {
  get(tenantId: string, name: string): Promise<string | undefined>;
  set(tenantId: string, name: string, value: string): Promise<void>;
  delete(tenantId: string, name: string): Promise<void>;
}

/** What commerce needs from the catalog and tenancy modules. */
export interface CommerceCatalog {
  findForSale(tenantId: string, slug: string): Promise<{ id: string; title: string; status: string; effectiveCents: number | null; currency: string } | undefined>;
  recordSale(tenantId: string, artworkId: string): Promise<void>;
}

export interface TenantDirectory {
  info(tenantId: string): Promise<{ slug: string; name: string; primaryHost: string } | undefined>;
}
