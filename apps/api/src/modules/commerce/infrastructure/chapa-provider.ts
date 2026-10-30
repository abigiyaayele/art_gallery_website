import crypto from 'node:crypto';
import { toCents, toMajor } from '../domain/order.js';
import type { InitializeRequest, PaymentProvider, ProviderCredentials, VerifiedPayment } from '../application/ports.js';

/** Chapa only accepts letters, numbers, hyphens, underscores, spaces and dots in customization text. */
const clean = (text: string, max: number) => text.replace(/[^A-Za-z0-9\-_. ]/g, '').slice(0, max);

export class ChapaProvider implements PaymentProvider {
  readonly name = 'chapa';

  constructor(
    private readonly baseUrl = 'https://api.chapa.co/v1',
    private readonly timeoutMs = 15_000,
  ) {}

  async initialize(creds: ProviderCredentials, req: InitializeRequest) {
    const res = await fetch(`${this.baseUrl}/transaction/initialize`, {
      method: 'POST',
      headers: { authorization: `Bearer ${creds.secretKey}`, 'content-type': 'application/json' },
      signal: AbortSignal.timeout(this.timeoutMs),
      body: JSON.stringify({
        amount: toMajor(req.amountCents),
        currency: req.currency,
        email: req.email,
        first_name: req.firstName,
        last_name: req.lastName,
        phone_number: req.phone || undefined,
        tx_ref: req.txRef,
        callback_url: req.callbackUrl,
        return_url: req.returnUrl,
        customization: { title: clean(req.title, 16) || 'Artwork', description: clean(req.description, 50) },
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { status?: string; message?: unknown; data?: { checkout_url?: string } };
    if (!res.ok || body.status !== 'success' || !body.data?.checkout_url) {
      throw new Error(`Chapa initialize failed: ${JSON.stringify(body.message ?? body)}`);
    }
    return { checkoutUrl: body.data.checkout_url };
  }

  async verify(creds: ProviderCredentials, txRef: string): Promise<VerifiedPayment> {
    const res = await fetch(`${this.baseUrl}/transaction/verify/${encodeURIComponent(txRef)}`, {
      headers: { authorization: `Bearer ${creds.secretKey}` },
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    const body = (await res.json().catch(() => ({}))) as {
      status?: string;
      data?: { status?: string; amount?: string | number; currency?: string; reference?: string };
    };
    if (!res.ok || body.status !== 'success' || !body.data) {
      return { status: 'pending', amountCents: 0, currency: '', reference: '', raw: body };
    }
    const status = body.data.status === 'success' ? 'paid' : body.data.status === 'failed' ? 'failed' : 'pending';
    return { status, amountCents: toCents(body.data.amount ?? 0), currency: body.data.currency ?? '', reference: body.data.reference ?? '', raw: body.data };
  }

  /** Chapa signs the raw body with HMAC-SHA256 using the webhook secret. */
  isValidWebhook(creds: ProviderCredentials, rawBody: Buffer, headers: Record<string, string | string[] | undefined>) {
    const header = headers['x-chapa-signature'] ?? headers['chapa-signature'];
    const signature = Array.isArray(header) ? header[0] : header;
    if (!signature) return false;
    const expected = crypto.createHmac('sha256', creds.webhookSecret).update(rawBody).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  webhookTxRef(body: unknown) {
    const b = body as { tx_ref?: unknown; trx_ref?: unknown } | null;
    const ref = b?.tx_ref ?? b?.trx_ref;
    return typeof ref === 'string' ? ref : undefined;
  }
}
