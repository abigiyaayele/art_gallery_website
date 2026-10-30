import type { PublicArtworkDto } from '@platform/contracts';
import { useMemo } from 'react';
import { formatMoney } from '../../platform/api';
import { useBlocks, useSite } from '../../platform/SiteProvider';

/** The shape the atelier pages draw: one painting, prices in cents. */
export interface Artwork {
  id: string;
  title: string;
  image: string;
  thumb: string;
  alt: string;
  /** Short lines shown under the exhibition carousel. */
  details: string[];
  story: string;
  dimensions: string;
  price: number;
  salePrice?: number;
  currency: string;
  sold: boolean;
  collection: string;
}

export interface Exhibition {
  slug: string;
  title: string;
  genre: string;
  date: string;
  location: string;
  isPast: boolean;
  items: Artwork[];
}

export interface ArchiveArtwork extends Artwork {
  width: string;
}

const archiveWidths = ['250px', '200px', '180px', '220px', '150px', '190px', '210px', '170px'];

function toArtwork(a: PublicArtworkDto): Artwork {
  const img = a.images[0];
  return {
    id: a.slug,
    title: a.title.toUpperCase(),
    image: img?.urls.large ?? img?.urls.medium ?? '',
    thumb: img?.urls.thumb ?? img?.urls.medium ?? '',
    alt: img?.alt ?? a.title,
    details: a.description.split(/(?<=[.!?])\s+/).filter(Boolean),
    story: a.story || a.description,
    dimensions: a.dimensions || 'Size on request',
    price: a.price?.regularCents ?? 0,
    salePrice: a.price?.onSale ? a.price.effectiveCents : undefined,
    currency: a.price?.currency ?? 'USD',
    sold: a.sold,
    collection: a.collection,
  };
}

/**
 * Everything the atelier theme shows, derived from the tenant's published
 * work and site content: exhibitions are the artist's collections.
 */
export function useCatalog() {
  const { site, artworks } = useSite();
  const exhibitionMeta = useBlocks('about', 'exhibitions').flatMap(b => b.items);
  const promoBlock = useBlocks('offers', 'text')[0];

  return useMemo(() => {
    const allArtworks = artworks.map(toArtwork);
    const groups = new Map<string, Artwork[]>();
    for (const a of allArtworks) {
      const key = a.collection || 'Works';
      groups.set(key, [...(groups.get(key) ?? []), a]);
    }
    const exhibitions: Exhibition[] = [...groups.entries()].map(([title, items], i) => {
      const meta = exhibitionMeta.find(m => m.title.toLowerCase() === title.toLowerCase());
      return {
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        title: title.toUpperCase(),
        genre: (meta?.subtitle ?? '').toUpperCase(),
        date: (meta?.date ?? (i === 0 ? 'NEW WORK' : 'EARLIER WORK')).toUpperCase(),
        location: (meta?.location ?? site.profile.location).toUpperCase(),
        isPast: i > 0,
        items,
      };
    });
    return {
      site,
      allArtworks,
      exhibitions,
      archive: allArtworks.map((a, i): ArchiveArtwork => ({ ...a, width: archiveWidths[i % archiveWidths.length]! })),
      promotion: promoBlock ? { title: promoBlock.heading, message: promoBlock.body } : null,
      paymentsEnabled: site.shop.paymentsEnabled,
      getArtwork: (id: string | undefined) => allArtworks.find(a => a.id === id),
    };
  }, [artworks, site, exhibitionMeta, promoBlock]);
}

export function isOnSale(artwork: Artwork): boolean {
  return !artwork.sold && artwork.salePrice !== undefined && artwork.salePrice < artwork.price;
}

/** The price a buyer pays today. */
export function currentPrice(artwork: Artwork): number {
  return isOnSale(artwork) ? artwork.salePrice! : artwork.price;
}

export function discountPercent(artwork: Artwork): number {
  return isOnSale(artwork) ? Math.round((1 - artwork.salePrice! / artwork.price) * 100) : 0;
}

export function formatPrice(cents: number, currency = 'USD'): string {
  return `${formatMoney(cents, currency)} ${currency}`;
}
