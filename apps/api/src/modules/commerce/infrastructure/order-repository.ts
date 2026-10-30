import type { OrderStatus } from '@platform/contracts';
import type { Db } from '../../../shared/db/database.js';
import type { OrderRow } from '../../../shared/db/schema.js';
import { HoldConflict, type NewOrder, type OrderRecord, type OrderRepository, type SecretStore } from '../application/ports.js';

const toRecord = (r: OrderRow): OrderRecord => ({
  id: r.id,
  tenantId: r.tenant_id,
  kind: r.kind,
  artworkId: r.artwork_id,
  artworkTitle: r.artwork_title,
  amountCents: r.amount_cents,
  currency: r.currency,
  status: r.status,
  buyer: { name: r.buyer_name, email: r.buyer_email, phone: r.buyer_phone },
  shipping: r.shipping,
  note: r.note,
  txRef: r.tx_ref,
  holdExpiresAt: r.hold_expires_at?.toISOString() ?? null,
  paidAt: r.paid_at?.toISOString() ?? null,
  createdAt: r.created_at.toISOString(),
});

export class KyselyOrderRepository implements OrderRepository {
  constructor(private readonly db: Db) {}

  async create(o: NewOrder) {
    try {
      const row = await this.db
        .insertInto('orders')
        .values({
          tenant_id: o.tenantId,
          kind: o.kind,
          artwork_id: o.artworkId,
          artwork_title: o.artworkTitle,
          amount_cents: o.amountCents,
          currency: o.currency,
          buyer_name: o.buyer.name,
          buyer_email: o.buyer.email,
          buyer_phone: o.buyer.phone,
          shipping: JSON.stringify(o.shipping),
          note: o.note,
          tx_ref: o.txRef,
          hold_expires_at: o.holdExpiresAt,
          paid_at: null,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      return toRecord(row);
    } catch (err) {
      if ((err as { constraint?: string }).constraint === 'orders_one_pending_hold') throw new HoldConflict();
      throw err;
    }
  }

  async findByTxRef(tenantId: string, txRef: string) {
    const row = await this.db.selectFrom('orders').selectAll().where('tenant_id', '=', tenantId).where('tx_ref', '=', txRef).executeTakeFirst();
    return row && toRecord(row);
  }

  async find(tenantId: string, id: string) {
    const row = await this.db.selectFrom('orders').selectAll().where('tenant_id', '=', tenantId).where('id', '=', id).executeTakeFirst();
    return row && toRecord(row);
  }

  async list(tenantId: string, status?: OrderStatus) {
    let q = this.db.selectFrom('orders').selectAll().where('tenant_id', '=', tenantId);
    if (status) q = q.where('status', '=', status);
    return (await q.orderBy('created_at', 'desc').limit(500).execute()).map(toRecord);
  }

  async setStatus(tenantId: string, id: string, status: OrderStatus, extra: { paidAt?: Date } = {}) {
    await this.db
      .updateTable('orders')
      .set({ status, ...(extra.paidAt ? { paid_at: extra.paidAt } : {}), updated_at: new Date() })
      .where('tenant_id', '=', tenantId)
      .where('id', '=', id)
      .execute();
  }

  async updateNote(tenantId: string, id: string, note: string) {
    await this.db.updateTable('orders').set({ note, updated_at: new Date() }).where('tenant_id', '=', tenantId).where('id', '=', id).execute();
  }

  async expireStaleHolds(tenantId: string, now: Date) {
    await this.db
      .updateTable('orders')
      .set({ status: 'expired', updated_at: now })
      .where('tenant_id', '=', tenantId)
      .where('status', '=', 'pending')
      .where('hold_expires_at', '<', now)
      .execute();
  }

  async recordPayment(p: { tenantId: string; orderId: string; provider: string; reference: string; status: string; raw: unknown; verified: boolean }) {
    await this.db
      .insertInto('payments')
      .values({
        tenant_id: p.tenantId,
        order_id: p.orderId,
        provider: p.provider,
        provider_reference: p.reference,
        status: p.status,
        raw: JSON.stringify(p.raw ?? {}),
        verified_at: p.verified ? new Date() : null,
      })
      .execute();
  }
}

export class KyselySecretStore implements SecretStore {
  constructor(private readonly db: Db) {}

  async get(tenantId: string, name: string) {
    const row = await this.db
      .selectFrom('tenant_secrets')
      .select('ciphertext')
      .where('tenant_id', '=', tenantId)
      .where('name', '=', name)
      .executeTakeFirst();
    return row?.ciphertext;
  }

  async set(tenantId: string, name: string, value: string) {
    await this.db
      .insertInto('tenant_secrets')
      .values({ tenant_id: tenantId, name, ciphertext: value })
      .onConflict(oc => oc.columns(['tenant_id', 'name']).doUpdateSet({ ciphertext: value, updated_at: new Date() }))
      .execute();
  }

  async delete(tenantId: string, name: string) {
    await this.db.deleteFrom('tenant_secrets').where('tenant_id', '=', tenantId).where('name', '=', name).execute();
  }
}
