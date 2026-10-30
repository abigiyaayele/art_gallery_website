import { describe, expect, it } from 'vitest';
import { Artwork, slugify } from './artwork.js';
import { computePrice } from './pricing.js';

const base = {
  id: 'a1',
  tenantId: 't1',
  title: 'Under the Vines',
  slug: 'under-the-vines',
  description: '',
  story: '',
  medium: 'Oil on canvas',
  dimensions: '',
  year: null,
  collection: '',
  categoryId: null,
  tags: [],
  seoTitle: '',
  seoDescription: '',
  priceCents: 120000,
  currency: 'USD',
  discount: null,
  featured: false,
  imageIds: ['img1'],
};

describe('pricing', () => {
  it('applies a percentage discount', () => {
    expect(computePrice(10000, 'USD', { type: 'percent', value: 25 })).toEqual({
      currency: 'USD',
      regularCents: 10000,
      effectiveCents: 7500,
      onSale: true,
      percentOff: 25,
    });
  });

  it('applies a fixed sale price and reports the percent off', () => {
    expect(computePrice(120000, 'USD', { type: 'fixed_price', value: 90000 })?.percentOff).toBe(25);
  });

  it('has no price until one is set', () => {
    expect(computePrice(null, 'USD', null)).toBeNull();
  });
});

describe('artwork', () => {
  it('starts as a draft and publishes when complete', () => {
    const a = Artwork.create(base);
    expect(a.status).toBe('draft');
    a.publish(1);
    expect(a.status).toBe('available');
    expect(a.snapshot.publishedAt).toBeInstanceOf(Date);
  });

  it('will not publish without a price or a processed image', () => {
    const noPrice = Artwork.create({ ...base, priceCents: null });
    expect(() => noPrice.publish(1)).toThrow(/price/);
    expect(() => Artwork.create(base).publish(0)).toThrow(/processed image/);
  });

  it('rejects a sale price that is not below the price', () => {
    expect(() => Artwork.create({ ...base, discount: { type: 'fixed_price', value: 120000 } })).toThrow(/lower/);
  });

  it('drops the discount when the price is cleared on a draft', () => {
    const a = Artwork.create({ ...base, discount: { type: 'percent', value: 10 } });
    a.update({ priceCents: null });
    expect(a.snapshot.discount).toBeNull();
  });

  it('keeps a published artwork publishable on edit', () => {
    const a = Artwork.create(base);
    a.publish(1);
    expect(() => a.update({ priceCents: null })).toThrow(/price/);
  });

  it('marks sold and reverts', () => {
    const a = Artwork.create(base);
    a.publish(1);
    a.markSold();
    expect(a.status).toBe('sold');
    expect(() => a.unpublish()).toThrow(/Revert/);
    a.revertSold();
    expect(a.status).toBe('available');
  });

  it('normalizes tags', () => {
    expect(Artwork.create({ ...base, tags: ['Birds', 'birds ', 'Forest'] }).snapshot.tags).toEqual(['birds', 'forest']);
  });
});

describe('slugify', () => {
  it('makes url-safe slugs', () => {
    expect(slugify('Three Sisters & the Crane!')).toBe('three-sisters-the-crane');
    expect(slugify('Ü')).toBe('artwork-u');
  });
});
