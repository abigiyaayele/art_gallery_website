import type { ContentBlock, PageSlug, PublicArtworkDto, PublicSiteDto } from '@platform/contracts';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { platform } from './api';

interface SiteState {
  site: PublicSiteDto;
  artworks: PublicArtworkDto[];
  refresh(): Promise<void>;
}

const SiteContext = createContext<SiteState | null>(null);

/** How often an open page re-checks for dashboard changes (published, discounted, sold). */
const REFRESH_MS = 30_000;

export function SiteProvider({ children, fallback }: { children: ReactNode; fallback: (error: Error | null) => ReactNode }) {
  const [data, setData] = useState<{ site: PublicSiteDto; artworks: PublicArtworkDto[] } | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [site, artworks] = await Promise.all([platform.site(), platform.artworks()]);
      setData({ site, artworks: artworks.items });
      setError(null);
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => document.visibilityState === 'visible' && void refresh(), REFRESH_MS);
    const onFocus = () => void refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh]);

  if (!data) return <>{fallback(error)}</>;
  return <SiteContext.Provider value={{ ...data, refresh }}>{children}</SiteContext.Provider>;
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used inside SiteProvider');
  return ctx;
}

export function usePage(slug: PageSlug) {
  return useSite().site.pages.find(p => p.slug === slug) ?? null;
}

export function useBlocks<T extends ContentBlock['type']>(slug: PageSlug, type: T) {
  return (usePage(slug)?.blocks.filter(b => b.type === type) ?? []) as Extract<ContentBlock, { type: T }>[];
}

/** Picks artworks for an "artworks" content block. */
export function selectArtworks(artworks: PublicArtworkDto[], block: Extract<ContentBlock, { type: 'artworks' }>) {
  const available = artworks.filter(a => !a.sold);
  const list =
    block.mode === 'featured'
      ? [...artworks.filter(a => a.featured), ...available.filter(a => !a.featured)]
      : block.mode === 'on_sale'
        ? available.filter(a => a.price?.onSale)
        : available;
  return list.slice(0, block.limit);
}
