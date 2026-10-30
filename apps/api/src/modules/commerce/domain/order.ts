import type { OrderStatus } from '@platform/contracts';
import { DomainError } from '../../../shared/errors.js';

/** Allowed manual and automatic transitions. Payment results move pending orders; artists move paid ones. */
const transitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'failed', 'expired'],
  paid: ['shipped', 'refunded'],
  shipped: ['refunded'],
  failed: [],
  expired: [],
  refunded: [],
};

export function assertTransition(from: OrderStatus, to: OrderStatus) {
  if (!transitions[from].includes(to)) throw new DomainError('invalid_order_status', `An order that is ${from} cannot become ${to}`);
}

/** Unique, provider-safe reference: letters, digits and hyphens only. */
export function newTxRef(tenantSlug: string) {
  const rand = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  return `${tenantSlug.slice(0, 12)}-${Date.now().toString(36)}-${rand}`;
}

export function splitName(name: string) {
  const [first, ...rest] = name.trim().split(/\s+/);
  return { firstName: first ?? name, lastName: rest.join(' ') || first || name };
}

/** Major units for providers that take "1200.00" style amounts. */
export const toMajor = (cents: number) => (cents / 100).toFixed(2);
export const toCents = (major: number | string) => Math.round(Number(major) * 100);
