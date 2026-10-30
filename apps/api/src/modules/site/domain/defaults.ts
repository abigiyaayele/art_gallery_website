import type { ContentBlock, PageSlug, SitePageInput } from '@platform/contracts';

/** Pages every new site starts with, filled from the tenant's name; artists then edit them. */
export function defaultPages(siteTitle: string): Record<PageSlug, SitePageInput> {
  const blocks = (b: ContentBlock[]) => b;
  return {
    home: { title: 'Home', enabled: true, blocks: blocks([{ type: 'hero', heading: siteTitle, subheading: '', imageIds: [] }, { type: 'artworks', heading: 'Latest work', mode: 'latest', limit: 8 }]) },
    gallery: { title: 'Gallery', enabled: true, blocks: [] },
    offers: { title: 'Offers', enabled: true, blocks: blocks([{ type: 'text', heading: 'On offer', body: '' }]) },
    about: { title: 'About', enabled: true, blocks: blocks([{ type: 'text', heading: `About ${siteTitle}`, body: '' }]) },
    commission: { title: 'Commissions', enabled: false, blocks: blocks([{ type: 'text', heading: 'Commission a painting', body: '' }]) },
    contact: { title: 'Contact', enabled: true, blocks: [] },
  };
}

/** Every image id a page references, for ownership checks and URL lookup. */
export function blockImageIds(blocks: ContentBlock[]): string[] {
  return blocks.flatMap(b => {
    if (b.type === 'hero' || b.type === 'gallery') return b.imageIds;
    if (b.type === 'clients') return b.items.flatMap(i => i.imageIds);
    return [];
  });
}
