import type { Readable } from 'node:stream';
import type { ImageVariant } from '@platform/contracts';
import type { AssetVariant } from '../../../shared/db/schema.js';

export interface StoredObject {
  body: Readable;
  contentType: string;
  contentLength?: number;
}

export interface ObjectStorage {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<StoredObject | undefined>;
  getBuffer(key: string): Promise<Buffer | undefined>;
  delete(keys: string[]): Promise<void>;
}

export interface ImageInfo {
  format: string | undefined;
  width: number | undefined;
  height: number | undefined;
}

export interface ImageProcessor {
  inspect(input: Buffer): Promise<ImageInfo | undefined>;
  /** Auto-rotates, strips metadata (including GPS) and fits inside a square of maxEdge pixels, as WebP. */
  variant(input: Buffer, maxEdge: number): Promise<{ data: Buffer; width: number; height: number }>;
}

export interface AssetRecord {
  id: string;
  tenantId: string;
  kind: 'artwork' | 'site';
  status: 'processing' | 'ready' | 'failed';
  originalKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  variants: Partial<Record<ImageVariant, AssetVariant>>;
  altText: string;
  createdAt: Date;
}

export interface AssetRepository {
  create(a: Omit<AssetRecord, 'status' | 'width' | 'height' | 'variants' | 'createdAt' | 'altText'>): Promise<AssetRecord>;
  find(tenantId: string, id: string): Promise<AssetRecord | undefined>;
  /** Used only by public asset serving, which then checks visibility. */
  findAnyTenant(id: string): Promise<AssetRecord | undefined>;
  findMany(tenantId: string, ids: string[]): Promise<AssetRecord[]>;
  list(tenantId: string, kind?: AssetRecord['kind']): Promise<AssetRecord[]>;
  markReady(id: string, info: { width: number; height: number; variants: Record<string, AssetVariant> }): Promise<void>;
  markFailed(id: string, error: string): Promise<void>;
  updateAlt(tenantId: string, id: string, altText: string): Promise<void>;
  delete(tenantId: string, id: string): Promise<void>;
}

/** Answers whether an asset may be shown to anyone; implemented by the modules that use assets. */
export interface AssetVisibility {
  isPublic(asset: { id: string; tenantId: string; kind: AssetRecord['kind'] }): Promise<boolean>;
  isInUse(tenantId: string, assetId: string): Promise<boolean>;
}
