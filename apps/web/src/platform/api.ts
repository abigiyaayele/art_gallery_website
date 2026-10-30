import type {
  ApiError,
  CheckoutStarted,
  InquiryInput,
  Page,
  PublicArtworkDto,
  PublicOrderStatus,
  PublicSiteDto,
} from '@platform/contracts';

/**
 * The website talks to the platform API through /api on its own origin. The
 * dev server and the production server forward the visitor's host, so the
 * API knows which artist's site this is.
 */
const BASE = import.meta.env.VITE_API_URL ?? '/api';

async function request<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: init?.json !== undefined ? { 'content-type': 'application/json' } : undefined,
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiError | null;
    throw Object.assign(new Error(body?.error.message ?? 'Something went wrong. Please try again.'), { status: res.status, code: body?.error.code });
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export const platform = {
  site: () => request<PublicSiteDto>('/public/site'),
  artworks: () => request<Page<PublicArtworkDto>>('/public/artworks?limit=200'),
  checkout: (input: { artworkSlug: string; buyer: { name: string; email: string; phone?: string }; shipping?: Record<string, string>; note?: string }) =>
    request<CheckoutStarted>('/public/checkout', { method: 'POST', json: input }),
  deposit: (input: { buyer: { name: string; email: string; phone?: string }; amountCents: number; currency?: string; note?: string }) =>
    request<CheckoutStarted>('/public/checkout/deposit', { method: 'POST', json: input }),
  orderStatus: (txRef: string) => request<PublicOrderStatus>(`/public/orders/${encodeURIComponent(txRef)}`),
  inquiry: (input: Omit<InquiryInput, 'phone' | 'subject' | 'details'> & Partial<Pick<InquiryInput, 'phone' | 'subject' | 'details'>>) =>
    request<{ ok: true }>('/public/inquiries', { method: 'POST', json: input }),
  view: (path: string) => request<void>('/public/views', { method: 'POST', json: { path } }).catch(() => undefined),
};

export function formatMoney(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: cents % 100 === 0 ? 0 : 2 }).format(cents / 100);
}
