/** Client for the payment server in /server (Chapa checkout). */

async function post(url: string, body: unknown): Promise<string> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.checkoutUrl) {
    throw new Error(data.error || 'Online payment is unavailable right now. Please contact the studio.');
  }
  return data.checkoutUrl;
}

/** Starts a Chapa checkout for a painting and returns the hosted payment page URL. */
export function startArtworkCheckout(details: { artworkId: number; [field: string]: string | number }) {
  return post('/api/checkout/artwork', details);
}

/** Starts a Chapa checkout for a commission deposit. */
export function startDepositCheckout(details: { firstName: string; lastName: string; email: string; amount: number; note: string }) {
  return post('/api/checkout/deposit', details);
}

export interface PaymentResult {
  status: 'pending' | 'paid' | 'failed';
  kind: 'artwork' | 'deposit';
  amount: number;
  artworkTitle?: string;
}

export async function verifyPayment(txRef: string): Promise<PaymentResult> {
  const res = await fetch(`/api/payments/verify/${encodeURIComponent(txRef)}`);
  if (!res.ok) throw new Error('Payment not found');
  return res.json();
}

/** Ids of paintings bought online. Empty when the payment server is not running (static hosting). */
export async function fetchSoldIds(timeoutMs = 2000): Promise<number[]> {
  try {
    const res = await fetch('/api/sold', { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.ids) ? data.ids : [];
  } catch {
    return [];
  }
}
