import crypto from 'node:crypto';
import { imageVariants, type AssetDto, type ImageVariant } from '@platform/contracts';
import { assertCan } from '../../../shared/auth/policy.js';
import type { Actor } from '../../../shared/context.js';
import type { AssetVariant } from '../../../shared/db/schema.js';
import { DomainError, NotFoundError, ValidationError } from '../../../shared/errors.js';
import type { JobQueue } from '../../../shared/jobs/queue.js';
import { MAX_UPLOAD_BYTES, VARIANT_SIZES, acceptedFormat, assetKeys } from '../domain/asset.js';
import type { AssetRecord, AssetRepository, AssetVisibility, ImageProcessor, ObjectStorage, StoredObject } from './ports.js';
import type { AssetUrlSigner } from './url-signer.js';

export const PROCESS_ASSET_JOB = 'media.process-asset';

/** Maps assets to DTOs; `signed` for dashboard responses, plain for public ones. */
export class AssetPresenter {
  constructor(private readonly signer: AssetUrlSigner) {}

  toDto(a: AssetRecord, signed: boolean): AssetDto {
    const urls: AssetDto['urls'] = {};
    if (a.status === 'ready') {
      for (const v of imageVariants) {
        if (a.variants[v]) urls[v] = signed ? this.signer.signedUrl(a.id, v) : this.signer.publicUrl(a.id, v);
      }
    }
    return {
      id: a.id,
      kind: a.kind,
      status: a.status,
      originalName: a.originalName,
      mimeType: a.mimeType,
      sizeBytes: a.sizeBytes,
      width: a.width,
      height: a.height,
      altText: a.altText,
      urls,
      createdAt: a.createdAt.toISOString(),
    };
  }
}

export interface UploadFile {
  filename: string;
  data: Buffer;
}

export class UploadAsset {
  constructor(
    private readonly assets: AssetRepository,
    private readonly storage: ObjectStorage,
    private readonly images: ImageProcessor,
    private readonly jobs: JobQueue,
    private readonly presenter: AssetPresenter,
  ) {}

  async execute(actor: Actor, file: UploadFile, kind: AssetRecord['kind']): Promise<AssetDto> {
    assertCan(actor, kind === 'artwork' ? 'artwork:write' : 'site:write');
    if (file.data.length === 0) throw new ValidationError('The file is empty');
    if (file.data.length > MAX_UPLOAD_BYTES) throw new ValidationError('Images must be 25 MB or smaller');

    const info = await this.images.inspect(file.data);
    const format = acceptedFormat(info?.format);

    const id = crypto.randomUUID();
    const originalKey = assetKeys.original(actor.tenantId, id, format.ext);
    await this.storage.put(originalKey, file.data, format.mime);
    const asset = await this.assets.create({
      id,
      tenantId: actor.tenantId,
      kind,
      originalKey,
      originalName: file.filename.slice(0, 200),
      mimeType: format.mime,
      sizeBytes: file.data.length,
    });
    await this.jobs.enqueue(PROCESS_ASSET_JOB, { assetId: id });
    // Re-read: with the inline queue the asset may already be processed.
    return this.presenter.toDto((await this.assets.find(actor.tenantId, id)) ?? asset, true);
  }
}

/** Background job: generates the WebP variants and records the dimensions. */
export class ProcessAsset {
  constructor(
    private readonly assets: AssetRepository,
    private readonly storage: ObjectStorage,
    private readonly images: ImageProcessor,
  ) {}

  async execute({ assetId }: { assetId: string }) {
    const asset = await this.assets.findAnyTenant(assetId);
    if (!asset || asset.status === 'ready') return;
    try {
      const original = await this.storage.getBuffer(asset.originalKey);
      if (!original) throw new Error('original missing from storage');
      const info = await this.images.inspect(original);
      const variants: Record<string, AssetVariant> = {};
      for (const v of imageVariants) {
        const out = await this.images.variant(original, VARIANT_SIZES[v]);
        const key = assetKeys.variant(asset.tenantId, asset.id, v);
        await this.storage.put(key, out.data, 'image/webp');
        variants[v] = { key, width: out.width, height: out.height, bytes: out.data.length };
      }
      await this.assets.markReady(asset.id, { width: info?.width ?? 0, height: info?.height ?? 0, variants });
    } catch (err) {
      await this.assets.markFailed(asset.id, err instanceof Error ? err.message : String(err));
      throw err;
    }
  }
}

export class ListAssets {
  constructor(
    private readonly assets: AssetRepository,
    private readonly presenter: AssetPresenter,
  ) {}

  async execute(actor: Actor, kind?: AssetRecord['kind']) {
    assertCan(actor, 'workspace:read');
    return (await this.assets.list(actor.tenantId, kind)).map(a => this.presenter.toDto(a, true));
  }
}

export class UpdateAsset {
  constructor(
    private readonly assets: AssetRepository,
    private readonly presenter: AssetPresenter,
  ) {}

  async execute(actor: Actor, id: string, altText: string) {
    assertCan(actor, 'artwork:write');
    if (!(await this.assets.find(actor.tenantId, id))) throw new NotFoundError('Image');
    await this.assets.updateAlt(actor.tenantId, id, altText);
    return this.presenter.toDto((await this.assets.find(actor.tenantId, id))!, true);
  }
}

export class DeleteAsset {
  constructor(
    private readonly assets: AssetRepository,
    private readonly storage: ObjectStorage,
    private readonly visibility: AssetVisibility,
  ) {}

  async execute(actor: Actor, id: string) {
    assertCan(actor, 'artwork:write');
    const asset = await this.assets.find(actor.tenantId, id);
    if (!asset) throw new NotFoundError('Image');
    if (await this.visibility.isInUse(actor.tenantId, id)) {
      throw new DomainError('asset_in_use', 'Remove this image from its artwork or website section first');
    }
    await this.assets.delete(actor.tenantId, id);
    await this.storage.delete([asset.originalKey, ...Object.values(asset.variants).map(v => v.key)]);
  }
}

/** Streams a variant if it belongs to published work or the URL carries a valid signature. */
export class ServeAsset {
  constructor(
    private readonly assets: AssetRepository,
    private readonly storage: ObjectStorage,
    private readonly visibility: AssetVisibility,
    private readonly signer: AssetUrlSigner,
  ) {}

  async execute(id: string, variant: ImageVariant, sig?: { exp?: number; sig?: string }): Promise<StoredObject & { cacheable: boolean }> {
    const asset = await this.assets.findAnyTenant(id);
    const stored = asset?.variants[variant];
    if (!asset || !stored) throw new NotFoundError('Image');
    const signed = this.signer.verify(id, variant, sig?.exp, sig?.sig);
    const isPublic = signed ? false : await this.visibility.isPublic(asset);
    if (!signed && !isPublic) throw new NotFoundError('Image');
    const object = await this.storage.get(stored.key);
    if (!object) throw new NotFoundError('Image');
    return { ...object, cacheable: isPublic };
  }
}

export class ReadyImageCounter {
  constructor(private readonly assets: AssetRepository) {}

  async count(tenantId: string, ids: string[]) {
    if (ids.length === 0) return 0;
    return (await this.assets.findMany(tenantId, ids)).filter(a => a.status === 'ready').length;
  }
}
