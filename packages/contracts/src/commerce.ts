import { z } from 'zod';
import { currencySchema } from './catalog.js';

const text = (max: number) => z.string().trim().max(max);

export const buyerSchema = z.object({
  name: text(120).min(1),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: text(40).default(''),
});

export const checkoutInput = z.object({
  artworkSlug: z.string().min(1).max(80),
  buyer: buyerSchema,
  shipping: z.record(text(200)).default({}),
  note: text(1000).default(''),
});
export type CheckoutInput = z.infer<typeof checkoutInput>;

export const depositInput = z.object({
  buyer: buyerSchema,
  amountCents: z.number().int().min(100).max(10_000_000),
  currency: currencySchema.default('USD'),
  note: text(1000).default(''),
});
export type DepositInput = z.infer<typeof depositInput>;

export interface CheckoutStarted {
  orderId: string;
  txRef: string;
  checkoutUrl: string;
  holdExpiresAt: string | null;
}

export const orderStatuses = ['pending', 'paid', 'failed', 'expired', 'shipped', 'refunded'] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export interface OrderDto {
  id: string;
  kind: 'artwork' | 'deposit';
  artworkId: string | null;
  artworkTitle: string;
  amountCents: number;
  currency: string;
  status: OrderStatus;
  buyer: { name: string; email: string; phone: string };
  shipping: Record<string, string>;
  note: string;
  txRef: string;
  holdExpiresAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

/** What the website shows a buyer after returning from the payment page. */
export interface PublicOrderStatus {
  status: OrderStatus;
  kind: 'artwork' | 'deposit';
  amountCents: number;
  currency: string;
  artworkTitle: string;
}

export const updateOrderInput = z.object({
  status: z.enum(['shipped', 'refunded']).optional(),
  note: text(1000).optional(),
});

export const paymentSettingsInput = z.object({
  provider: z.literal('chapa'),
  secretKey: z.string().trim().min(10).max(200),
  webhookSecret: z.string().trim().min(8).max(200),
});
export type PaymentSettingsInput = z.infer<typeof paymentSettingsInput>;

export interface PaymentSettingsDto {
  provider: 'chapa' | null;
  configured: boolean;
  testMode: boolean;
  /** Last characters of the key, so the artist can tell which key is saved. */
  keyHint: string | null;
  webhookUrl: string;
}

export const inquiryKinds = ['contact', 'commission', 'purchase'] as const;

export const inquiryInput = z.object({
  kind: z.enum(inquiryKinds),
  name: text(120).min(1),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: text(40).default(''),
  subject: text(200).default(''),
  message: text(5000).min(1),
  details: z.record(text(500)).default({}),
  artworkSlug: z.string().max(80).optional(),
  /** Honeypot: real visitors never fill this in. */
  website: z.string().max(500).optional(),
});
export type InquiryInput = z.infer<typeof inquiryInput>;

export interface InquiryDto {
  id: string;
  kind: (typeof inquiryKinds)[number];
  status: 'new' | 'replied' | 'archived';
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  details: Record<string, string>;
  artworkId: string | null;
  createdAt: string;
}

export const updateInquiryInput = z.object({ status: z.enum(['new', 'replied', 'archived']) });

export const pageViewInput = z.object({ path: z.string().min(1).max(200) });
