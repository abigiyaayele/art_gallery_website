import type {
  ArtworkDto,
  ArtworkInput,
  ArtworkListQuery,
  ArtworkUpdateInput,
  BulkArtworkInput,
  CategoryDto,
  PublicArtworkDto,
} from '@platform/contracts';
import { assertCan } from '../../../shared/auth/policy.js';
import type { Actor } from '../../../shared/context.js';
import { ConflictError, NotFoundError, ValidationError } from '../../../shared/errors.js';
import { Artwork, slugify } from '../domain/artwork.js';
import type { ArtworkImages, ArtworkRepository, CategoryRepository } from './ports.js';
import type { ArtworkPresenter } from './presenter.js';

/** Shared lookups for the artwork use cases. */
class ArtworkService {
  constructor(
    readonly artworks: ArtworkRepository,
    readonly categories: CategoryRepository,
    readonly images: ArtworkImages,
    readonly presenter: ArtworkPresenter,
  ) {}

  async load(tenantId: string, id: string) {
    const artwork = await this.artworks.find(tenantId, id);
    if (!artwork) throw new NotFoundError('Artwork');
    return artwork;
  }

  async present(tenantId: string, artwork: Artwork): Promise<ArtworkDto> {
    return (await this.presenter.forDashboard(tenantId, [artwork]))[0]!;
  }

  async uniqueSlug(tenantId: string, wanted: string, exceptId?: string) {
    let slug = wanted;
    for (let n = 2; await this.artworks.slugTaken(tenantId, slug, exceptId); n++) slug = `${wanted.slice(0, 55)}-${n}`;
    return slug;
  }

  async checkCategory(tenantId: string, categoryId: string | null | undefined) {
    if (categoryId && !(await this.categories.find(tenantId, categoryId))) throw new ValidationError('Unknown category');
  }

  async checkImages(tenantId: string, ids: string[]) {
    const owned = await this.images.owned(tenantId, ids);
    if (owned.length !== new Set(ids).size) throw new ValidationError('One or more images were not found');
  }
}

export function createArtworkService(...args: ConstructorParameters<typeof ArtworkService>) {
  return new ArtworkService(...args);
}
type Svc = ArtworkService;

export class CreateArtwork {
  constructor(private readonly s: Svc) {}

  async execute(actor: Actor, input: ArtworkInput) {
    assertCan(actor, 'artwork:write');
    await this.s.checkCategory(actor.tenantId, input.categoryId);
    await this.s.checkImages(actor.tenantId, input.imageIds);
    if (input.slug && (await this.s.artworks.slugTaken(actor.tenantId, input.slug))) throw new ConflictError('That URL slug is already used');
    const { slug, imageIds, ...fields } = input;
    const artwork = Artwork.create({
      ...fields,
      id: this.s.artworks.newId(),
      tenantId: actor.tenantId,
      slug: slug ?? (await this.s.uniqueSlug(actor.tenantId, slugify(input.title))),
      imageIds,
    });
    await this.s.artworks.save(artwork);
    return this.s.present(actor.tenantId, artwork);
  }
}

export class UpdateArtwork {
  constructor(private readonly s: Svc) {}

  async execute(actor: Actor, id: string, input: ArtworkUpdateInput) {
    assertCan(actor, 'artwork:write');
    const artwork = await this.s.load(actor.tenantId, id);
    await this.s.checkCategory(actor.tenantId, input.categoryId);
    const { slug, imageIds, ...fields } = input;
    if (slug && slug !== artwork.snapshot.slug) {
      if (await this.s.artworks.slugTaken(actor.tenantId, slug, id)) throw new ConflictError('That URL slug is already used');
      artwork.changeSlug(slug);
    }
    if (imageIds) {
      await this.s.checkImages(actor.tenantId, imageIds);
      artwork.setImages(imageIds);
    }
    artwork.update(fields);
    await this.s.artworks.save(artwork);
    return this.s.present(actor.tenantId, artwork);
  }
}

export class DeleteArtwork {
  constructor(private readonly s: Svc) {}

  async execute(actor: Actor, id: string) {
    assertCan(actor, 'artwork:write');
    await this.s.load(actor.tenantId, id);
    await this.s.artworks.delete(actor.tenantId, id);
  }
}

export type StatusAction = 'publish' | 'unpublish' | 'mark_sold' | 'revert_sold';

export class ChangeArtworkStatus {
  constructor(private readonly s: Svc) {}

  async execute(actor: Actor, id: string, action: StatusAction) {
    assertCan(actor, action === 'revert_sold' ? 'workspace:manage' : 'artwork:publish');
    const artwork = await this.s.load(actor.tenantId, id);
    await apply(this.s, actor.tenantId, artwork, action);
    await this.s.artworks.save(artwork);
    return this.s.present(actor.tenantId, artwork);
  }
}

async function apply(s: Svc, tenantId: string, artwork: Artwork, action: StatusAction) {
  if (action === 'publish') artwork.publish(await s.images.countReady(tenantId, artwork.snapshot.imageIds));
  if (action === 'unpublish') artwork.unpublish();
  if (action === 'mark_sold') artwork.markSold();
  if (action === 'revert_sold') artwork.revertSold();
}

/** Applies one action to many artworks; reports the ones that could not change instead of failing all. */
export class BulkUpdateArtworks {
  constructor(private readonly s: Svc) {}

  async execute(actor: Actor, input: BulkArtworkInput) {
    assertCan(actor, 'artwork:publish');
    if (input.action === 'apply_discount' && !input.discount) throw new ValidationError('Choose a discount to apply');
    const artworks = await this.s.artworks.findMany(actor.tenantId, input.ids);
    const failed: { id: string; message: string }[] = [];
    for (const artwork of artworks) {
      try {
        if (input.action === 'delete') {
          await this.s.artworks.delete(actor.tenantId, artwork.id);
          continue;
        }
        if (input.action === 'apply_discount') artwork.update({ discount: input.discount });
        else if (input.action === 'clear_discount') artwork.update({ discount: null });
        else await apply(this.s, actor.tenantId, artwork, input.action);
        await this.s.artworks.save(artwork);
      } catch (err) {
        failed.push({ id: artwork.id, message: err instanceof Error ? err.message : 'Failed' });
      }
    }
    const missing = input.ids.filter(id => !artworks.some(a => a.id === id));
    return { updated: artworks.length - failed.length, failed: [...failed, ...missing.map(id => ({ id, message: 'Not found' }))] };
  }
}

export class GetArtwork {
  constructor(private readonly s: Svc) {}

  async execute(actor: Actor, id: string) {
    assertCan(actor, 'workspace:read');
    return this.s.present(actor.tenantId, await this.s.load(actor.tenantId, id));
  }
}

export class ListArtworks {
  constructor(private readonly s: Svc) {}

  async execute(actor: Actor, query: ArtworkListQuery) {
    assertCan(actor, 'workspace:read');
    const { items, total } = await this.s.artworks.list(actor.tenantId, query);
    return { items: await this.s.presenter.forDashboard(actor.tenantId, items), total };
  }
}

/** Used by other modules (checkout) to mark a sale without a user actor. */
export class RecordArtworkSale {
  constructor(private readonly s: Svc) {}

  async execute(tenantId: string, artworkId: string) {
    const artwork = await this.s.load(tenantId, artworkId);
    artwork.markSold();
    await this.s.artworks.save(artwork);
  }
}

// Categories

export class ListCategories {
  constructor(private readonly categories: CategoryRepository) {}

  async execute(actor: Actor) {
    assertCan(actor, 'workspace:read');
    return this.categories.list(actor.tenantId);
  }
}

export class SaveCategory {
  constructor(private readonly categories: CategoryRepository) {}

  async execute(actor: Actor, input: { name: string; slug?: string; sortOrder: number }, id?: string): Promise<CategoryDto> {
    assertCan(actor, 'artwork:write');
    if (id && !(await this.categories.find(actor.tenantId, id))) throw new NotFoundError('Category');
    const slug = input.slug ?? slugify(input.name);
    if (await this.categories.slugTaken(actor.tenantId, slug, id)) throw new ConflictError('A category with that name already exists');
    const data = { name: input.name, slug, sortOrder: input.sortOrder };
    return id ? this.categories.update(actor.tenantId, id, data) : this.categories.create(actor.tenantId, data);
  }
}

export class DeleteCategory {
  constructor(private readonly categories: CategoryRepository) {}

  async execute(actor: Actor, id: string) {
    assertCan(actor, 'artwork:write');
    if (!(await this.categories.find(actor.tenantId, id))) throw new NotFoundError('Category');
    await this.categories.delete(actor.tenantId, id);
  }
}

// Public website reads (tenant comes from the request host, not a user)

export class PublicCatalog {
  constructor(private readonly s: Svc) {}

  async list(tenantId: string, query: { category?: string; onSale?: boolean; status?: 'available' | 'sold'; limit: number; offset: number }) {
    const { items, total } = await this.s.artworks.list(tenantId, {
      publicOnly: true,
      categorySlug: query.category,
      onSale: query.onSale,
      status: query.status,
      limit: query.limit,
      offset: query.offset,
    });
    const categories = await this.s.categories.list(tenantId);
    return { items: await this.s.presenter.forPublic(tenantId, items, categories), total };
  }

  async get(tenantId: string, slug: string): Promise<PublicArtworkDto> {
    const artwork = await this.s.artworks.findPublicBySlug(tenantId, slug);
    if (!artwork) throw new NotFoundError('Artwork');
    return (await this.s.presenter.forPublic(tenantId, [artwork], await this.s.categories.list(tenantId)))[0]!;
  }

  categories(tenantId: string) {
    return this.s.categories.list(tenantId);
  }
}
