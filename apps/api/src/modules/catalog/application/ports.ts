import type { ArtworkListQuery, AssetDto, CategoryDto } from '@platform/contracts';
import type { Artwork, ArtworkProps } from '../domain/artwork.js';

export interface ArtworkRepository {
  find(tenantId: string, id: string): Promise<Artwork | undefined>;
  findMany(tenantId: string, ids: string[]): Promise<Artwork[]>;
  findPublicBySlug(tenantId: string, slug: string): Promise<Artwork | undefined>;
  list(tenantId: string, query: ArtworkListQuery & { publicOnly?: boolean; categorySlug?: string }): Promise<{ items: Artwork[]; total: number }>;
  slugTaken(tenantId: string, slug: string, exceptId?: string): Promise<boolean>;
  /** Inserts or updates the artwork and its image order in one transaction. */
  save(artwork: Artwork): Promise<void>;
  delete(tenantId: string, id: string): Promise<void>;
  newId(): string;
}

export interface CategoryRepository {
  list(tenantId: string): Promise<CategoryDto[]>;
  find(tenantId: string, id: string): Promise<CategoryDto | undefined>;
  slugTaken(tenantId: string, slug: string, exceptId?: string): Promise<boolean>;
  create(tenantId: string, c: Omit<CategoryDto, 'id'>): Promise<CategoryDto>;
  update(tenantId: string, id: string, c: Omit<CategoryDto, 'id'>): Promise<CategoryDto>;
  delete(tenantId: string, id: string): Promise<void>;
}

/** What catalog needs from the media module, without depending on its internals. */
export interface ArtworkImages {
  /** Ids from the list that belong to the tenant, in the given order. */
  owned(tenantId: string, ids: string[]): Promise<string[]>;
  countReady(tenantId: string, ids: string[]): Promise<number>;
  describe(tenantId: string, ids: string[], signed: boolean): Promise<Map<string, AssetDto>>;
}

export type { ArtworkProps };
