import type { ApiError, Session } from '@platform/contracts';

const BASE = import.meta.env.VITE_API_URL ?? '/api';

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

let accessToken: string | null = null;
let refreshing: Promise<Session | null> | null = null;
let onSessionChange: (s: Session | null) => void = () => {};

export function setSessionListener(fn: (s: Session | null) => void) {
  onSessionChange = fn;
}

export function applySession(session: Session | null) {
  accessToken = session?.accessToken ?? null;
  onSessionChange(session);
}

/** Exchanges the refresh cookie for a new session. Concurrent callers share one request. */
export function refreshSession(tenantId?: string): Promise<Session | null> {
  refreshing ??= fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(tenantId ? { tenantId } : {}),
  })
    .then(async res => (res.ok ? ((await res.json()) as Session) : null))
    .catch(() => null)
    .then(session => {
      applySession(session);
      return session;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

async function toError(res: Response) {
  const body = (await res.json().catch(() => null)) as ApiError | null;
  return new ApiRequestError(res.status, body?.error.code ?? 'error', body?.error.message ?? res.statusText, body?.error.details);
}

export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  if (accessToken) headers.set('authorization', `Bearer ${accessToken}`);
  let body = init.body;
  if (init.json !== undefined) {
    headers.set('content-type', 'application/json');
    body = JSON.stringify(init.json);
  }
  const res = await fetch(`${BASE}${path}`, { ...init, headers, body, credentials: 'include' });
  if (res.status === 401 && retry && !path.startsWith('/auth/')) {
    if (await refreshSession()) return api<T>(path, init, false);
  }
  if (!res.ok) throw await toError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const errorMessage = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong');
