/**
 * Vercel function that forwards /api/* to the platform API, the same job
 * server/index.ts does on a self-hosted server. It tells the API which
 * artist's site was visited through x-tenant-host. SITE_TENANT_HOST pins one
 * artist, for a deployment reached on an address the platform doesn't know
 * (such as a *.vercel.app URL).
 */
const HOP_BY_HOP = ['host', 'connection', 'content-length', 'transfer-encoding', 'keep-alive', 'upgrade', 'accept-encoding'];

async function proxy(request: Request): Promise<Response> {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) return Response.json({ error: { code: 'not_configured', message: 'API_URL is not set.' } }, { status: 500 });

  const url = new URL(request.url);
  const path = url.searchParams.get('__path') ?? '';
  url.searchParams.delete('__path');
  const target = new URL(`${apiUrl.replace(/\/$/, '')}/${path}${url.search}`);

  const headers = new Headers(request.headers);
  for (const h of HOP_BY_HOP) headers.delete(h);
  const visitedHost = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '';
  headers.set('x-tenant-host', process.env.SITE_TENANT_HOST || visitedHost);

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      redirect: 'manual',
      // Required by Node's fetch to stream a request body.
      ...(hasBody ? { duplex: 'half' } : {}),
    } as RequestInit);
  } catch {
    return Response.json({ error: { code: 'upstream', message: 'The site is temporarily unavailable.' } }, { status: 502 });
  }

  // fetch already decoded the body, so drop the encoding headers; keep every Set-Cookie.
  const out = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!['content-encoding', 'content-length', 'transfer-encoding', 'set-cookie'].includes(key)) out.set(key, value);
  });
  for (const cookie of upstream.headers.getSetCookie()) out.append('set-cookie', cookie);
  return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers: out });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE, proxy as OPTIONS, proxy as HEAD };
