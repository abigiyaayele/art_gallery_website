import { DomainError } from '../../../shared/errors.js';

/** Subdomains the platform keeps for itself. */
export const RESERVED_SLUGS = new Set(['www', 'api', 'app', 'admin', 'dashboard', 'assets', 'static', 'mail', 'platform']);

export function assertSlugAllowed(slug: string) {
  if (RESERVED_SLUGS.has(slug)) throw new DomainError('slug_reserved', `"${slug}" is reserved, choose another`);
}

/** Lowercases and strips the port and any trailing dot: "Seifu.Example.com:443." -> "seifu.example.com". */
export function normalizeHost(host: string): string {
  return host.trim().toLowerCase().replace(/:\d+$/, '').replace(/\.$/, '');
}

export function platformSubdomain(slug: string, platformDomain: string): string {
  return `${slug}.${normalizeHost(platformDomain)}`;
}

export function isPlatformHost(hostname: string, platformDomain: string): boolean {
  const base = normalizeHost(platformDomain);
  return hostname === base || hostname.endsWith(`.${base}`);
}
