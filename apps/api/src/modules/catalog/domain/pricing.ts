import type { Discount, Price } from '@platform/contracts';
import { DomainError } from '../../../shared/errors.js';

/** A discount must leave a positive price lower than the regular one. */
export function assertValidDiscount(priceCents: number | null, discount: Discount | null) {
  if (!discount) return;
  if (priceCents === null) throw new DomainError('discount_without_price', 'Set a price before adding a discount');
  if (discount.type === 'percent' && (discount.value < 1 || discount.value > 90)) {
    throw new DomainError('invalid_discount', 'A percentage discount must be between 1% and 90%');
  }
  if (discount.type === 'fixed_price' && (discount.value <= 0 || discount.value >= priceCents)) {
    throw new DomainError('invalid_discount', 'The sale price must be lower than the regular price');
  }
}

/** The single source of truth for what a buyer pays; the dashboard, website and checkout all use it. */
export function computePrice(priceCents: number | null, currency: string, discount: Discount | null): Price | null {
  if (priceCents === null) return null;
  let effective = priceCents;
  if (discount?.type === 'percent') effective = Math.round((priceCents * (100 - discount.value)) / 100);
  if (discount?.type === 'fixed_price') effective = discount.value;
  const onSale = effective < priceCents;
  return {
    currency,
    regularCents: priceCents,
    effectiveCents: effective,
    onSale,
    percentOff: onSale ? Math.round(((priceCents - effective) / priceCents) * 100) : null,
  };
}
