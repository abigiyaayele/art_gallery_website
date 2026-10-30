import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * The host a public request is for. The website's server forwards the
 * visitor's host in x-tenant-host; browsers calling the API directly use Host.
 * Public routes only expose published data, so a spoofed host reveals nothing private.
 */
export function requestHost(req: FastifyRequest): string | undefined {
  const forwarded = req.headers['x-tenant-host'];
  return (Array.isArray(forwarded) ? forwarded[0] : forwarded) ?? req.hostname;
}

/** Short shared caching: dashboard edits show on the site within about 30 seconds at most. */
export function publicCache(reply: FastifyReply) {
  reply.header('cache-control', 'public, max-age=15, stale-while-revalidate=30');
  reply.header('vary', 'x-tenant-host, host');
}
