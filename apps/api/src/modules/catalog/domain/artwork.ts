import type { ArtworkStatus, Discount } from '@platform/contracts';
import { DomainError } from '../../../shared/errors.js';
import { assertValidDiscount, computePrice } from './pricing.js';

export interface ArtworkProps {
  id: string;
  tenantId: string;
  title: string;
  slug: string;
  description: string;
  story: string;
  medium: string;
  dimensions: string;
  year: number | null;
  collection: string;
  categoryId: string | null;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  priceCents: number | null;
  currency: string;
  discount: Discount | null;
  status: ArtworkStatus;
  featured: boolean;
  imageIds: string[];
  publishedAt: Date | null;
  soldAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type EditableFields = Partial<
  Pick<
    ArtworkProps,
    | 'title'
    | 'description'
    | 'story'
    | 'medium'
    | 'dimensions'
    | 'year'
    | 'collection'
    | 'categoryId'
    | 'tags'
    | 'seoTitle'
    | 'seoDescription'
    | 'priceCents'
    | 'currency'
    | 'discount'
    | 'featured'
  >
>;

/**
 * Artwork aggregate. Status moves draft -> available (published) -> sold;
 * available can go back to draft, and an owner can revert a sale.
 */
export class Artwork {
  private constructor(private props: ArtworkProps) {}

  static create(props: Omit<ArtworkProps, 'status' | 'publishedAt' | 'soldAt' | 'createdAt' | 'updatedAt'>, now = new Date()) {
    assertValidDiscount(props.priceCents, props.discount);
    return new Artwork({ ...props, tags: dedupe(props.tags), status: 'draft', publishedAt: null, soldAt: null, createdAt: now, updatedAt: now });
  }

  static restore(props: ArtworkProps) {
    return new Artwork(props);
  }

  get id() {
    return this.props.id;
  }
  get status() {
    return this.props.status;
  }
  get snapshot(): Readonly<ArtworkProps> {
    return this.props;
  }
  get price() {
    return computePrice(this.props.priceCents, this.props.currency, this.props.discount);
  }
  get isPublic() {
    return this.props.status !== 'draft';
  }

  update(changes: EditableFields, now = new Date()) {
    const next = { ...this.props, ...stripUndefined(changes) };
    if (changes.tags) next.tags = dedupe(changes.tags);
    // Clearing the price also clears a discount that depends on it.
    if (changes.priceCents === null) next.discount = null;
    assertValidDiscount(next.priceCents, next.discount);
    if (next.status !== 'draft') this.assertPublishable(next);
    this.props = { ...next, updatedAt: now };
  }

  changeSlug(slug: string, now = new Date()) {
    this.props = { ...this.props, slug, updatedAt: now };
  }

  setImages(imageIds: string[], now = new Date()) {
    if (imageIds.length === 0 && this.props.status !== 'draft') {
      throw new DomainError('image_required', 'A published artwork needs at least one image');
    }
    this.props = { ...this.props, imageIds: [...new Set(imageIds)], updatedAt: now };
  }

  /** readyImageCount comes from the media module: images still processing do not count. */
  publish(readyImageCount: number, now = new Date()) {
    if (this.props.status === 'sold') throw new DomainError('already_sold', 'This artwork is already sold');
    this.assertPublishable(this.props, readyImageCount);
    this.props = { ...this.props, status: 'available', publishedAt: this.props.publishedAt ?? now, updatedAt: now };
  }

  unpublish(now = new Date()) {
    if (this.props.status === 'sold') throw new DomainError('already_sold', 'Revert the sale before unpublishing');
    this.props = { ...this.props, status: 'draft', publishedAt: null, updatedAt: now };
  }

  markSold(now = new Date()) {
    if (this.props.status === 'sold') return;
    this.props = { ...this.props, status: 'sold', soldAt: now, publishedAt: this.props.publishedAt ?? now, updatedAt: now };
  }

  revertSold(now = new Date()) {
    if (this.props.status !== 'sold') throw new DomainError('not_sold', 'This artwork is not marked as sold');
    this.props = { ...this.props, status: 'available', soldAt: null, updatedAt: now };
  }

  private assertPublishable(p: ArtworkProps, readyImageCount = p.imageIds.length) {
    const missing: string[] = [];
    if (!p.title.trim()) missing.push('title');
    if (p.priceCents === null) missing.push('price');
    if (readyImageCount < 1) missing.push('a processed image');
    if (missing.length) {
      throw new DomainError('not_publishable', `Add ${missing.join(', ')} before publishing`, { missing });
    }
  }
}

const dedupe = (tags: string[]) => [...new Set(tags.map(t => t.trim().toLowerCase()).filter(Boolean))];

function stripUndefined<T extends object>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
}

/** "Under the Vines!" -> "under-the-vines" */
export function slugify(title: string): string {
  const s = title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
  return s.length >= 3 ? s : `artwork-${s || 'untitled'}`.slice(0, 60);
}
