import crypto from 'crypto';

const API = process.env.CHAPA_API_URL || 'https://api.chapa.co/v1';

export const isChapaConfigured = () => Boolean(process.env.CHAPA_SECRET_KEY);

function headers() {
  return {
    Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };
}

/** Chapa only accepts letters, numbers, hyphens, underscores, spaces and dots in descriptions. */
function clean(text: string, max: number) {
  return text.replace(/[^A-Za-z0-9\-_. ]/g, '').slice(0, max);
}

export async function initializePayment(params: {
  txRef: string;
  amount: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  description: string;
  returnUrl: string;
  callbackUrl: string;
}): Promise<string> {
  const res = await fetch(`${API}/transaction/initialize`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      amount: params.amount.toFixed(2),
      currency: 'USD',
      email: params.email,
      first_name: params.firstName,
      last_name: params.lastName,
      phone_number: params.phone || undefined,
      tx_ref: params.txRef,
      callback_url: params.callbackUrl,
      return_url: params.returnUrl,
      customization: {
        title: 'Seifu Arts',
        description: clean(params.description, 50),
      },
    }),
  });
  const body = await res.json();
  if (!res.ok || body.status !== 'success') {
    throw new Error(`Chapa initialize failed: ${JSON.stringify(body.message ?? body)}`);
  }
  return body.data.checkout_url;
}

export interface VerifiedPayment {
  paid: boolean;
  amount: number;
  currency: string;
}

export async function verifyPayment(txRef: string): Promise<VerifiedPayment> {
  const res = await fetch(`${API}/transaction/verify/${encodeURIComponent(txRef)}`, { headers: headers() });
  const body = await res.json();
  if (!res.ok || body.status !== 'success') {
    return { paid: false, amount: 0, currency: '' };
  }
  return {
    paid: body.data?.status === 'success',
    amount: Number(body.data?.amount),
    currency: body.data?.currency,
  };
}

/** Checks the webhook signature Chapa sends (HMAC SHA256 of the raw body with the webhook secret). */
export function isValidWebhook(rawBody: Buffer, signature: string | undefined): boolean {
  const secret = process.env.CHAPA_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
