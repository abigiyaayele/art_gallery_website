import { describe, expect, it } from 'vitest';
import { assertSlugAllowed, isPlatformHost, normalizeHost, platformSubdomain } from './tenant.js';

describe('tenant domain rules', () => {
  it('normalizes hosts', () => {
    expect(normalizeHost('Seifu.Example.com:8080')).toBe('seifu.example.com');
    expect(normalizeHost('seifu.example.com.')).toBe('seifu.example.com');
  });

  it('builds and recognizes platform subdomains', () => {
    expect(platformSubdomain('seifu', 'Platform.app')).toBe('seifu.platform.app');
    expect(isPlatformHost('seifu.platform.app', 'platform.app')).toBe(true);
    expect(isPlatformHost('seifuplatform.app', 'platform.app')).toBe(false);
  });

  it('refuses reserved slugs', () => {
    expect(() => assertSlugAllowed('admin')).toThrow(/reserved/);
    expect(() => assertSlugAllowed('seifu')).not.toThrow();
  });
});
