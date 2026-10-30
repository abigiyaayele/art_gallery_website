import type { ArtworkDto, AssetDto, CategoryDto, PublicArtworkDto } from '@platform/contracts';
import type { Artwork } from '../domain/artwork.js';
import type { ArtworkImages } from './ports.js';

export class ArtworkPresenter {
  constructor(private readonly images: ArtworkImages) {}

  async forDashboard(tenantId: string, artworks: Artwork[]): Promise<ArtworkDto[]> {
    const assets = await this.images.describe(tenantId, artworks.flatMap(a => a.snapshot.imageIds), true);
    return artworks.map(a => {
      const p = a.snapshot;
      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        description: p.description,
        story: p.story,
        medium: p.medium,
        dimensions: p.dimensions,
        year: p.year,
        collection: p.collection,
        categoryId: p.categoryId,
        tags: p.tags,
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
        priceCents: p.priceCents,
        currency: p.currency,
        discount: p.discount,
        price: a.price,
        status: p.status,
        featured: p.featured,
        images: p.imageIds.map(id => assets.get(id)).filter((x): x is AssetDto => !!x),
        publishedAt: p.publishedAt?.toISOString() ?? null,
        soldAt: p.soldAt?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      };
    });
  }

  async forPublic(tenantId: string, artworks: Artwork[], categories: CategoryDto[]): Promise<PublicArtworkDto[]> {
    const assets = await this.images.describe(tenantId, artworks.flatMap(a => a.snapshot.imageIds), false);
    const byId = new Map(categories.map(c => [c.id, c]));
    return artworks.map(a => {
      const p = a.snapshot;
      const category = p.categoryId ? byId.get(p.categoryId) : undefined;
      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        description: p.description,
        story: p.story,
        medium: p.medium,
        dimensions: p.dimensions,
        year: p.year,
        collection: p.collection,
        category: category ? { name: category.name, slug: category.slug } : null,
        tags: p.tags,
        seoTitle: p.seoTitle || p.title,
        seoDescription: p.seoDescription || p.description.slice(0, 160),
        price: a.price,
        sold: p.status === 'sold',
        featured: p.featured,
        images: p.imageIds
          .map(id => assets.get(id))
          .filter((x): x is AssetDto => !!x && x.status === 'ready')
          .map(x => ({ id: x.id, alt: x.altText || p.title, width: x.width, height: x.height, urls: x.urls })),
        publishedAt: p.publishedAt?.toISOString() ?? null,
      };
    });
  }
}
