import { imageVariants, updateAssetInput, uuid } from '@platform/contracts';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ValidationError } from '../../../shared/errors.js';
import { requireActor } from '../../../shared/http/auth.js';
import { parse } from '../../../shared/http/validate.js';
import { MAX_UPLOAD_BYTES } from '../domain/asset.js';
import type { DeleteAsset, ListAssets, ServeAsset, UpdateAsset, UploadAsset } from '../application/use-cases.js';

export interface MediaUseCases {
  upload: UploadAsset;
  list: ListAssets;
  update: UpdateAsset;
  remove: DeleteAsset;
  serve: ServeAsset;
}

export function mediaRoutes(uc: MediaUseCases) {
  return async (app: FastifyInstance) => {
    app.post('/media', { bodyLimit: MAX_UPLOAD_BYTES + 1024 * 1024 }, async (req, reply) => {
      const actor = requireActor(req);
      const { kind } = parse(z.object({ kind: z.enum(['artwork', 'site']).default('artwork') }), req.query);
      const file = await req.file({ limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } });
      if (!file) throw new ValidationError('Attach an image file');
      const data = await file.toBuffer().catch(() => {
        throw new ValidationError('Images must be 25 MB or smaller');
      });
      return reply.status(201).send(await uc.upload.execute(actor, { filename: file.filename, data }, kind));
    });

    app.get('/media', async req => {
      const { kind } = parse(z.object({ kind: z.enum(['artwork', 'site']).optional() }), req.query);
      return uc.list.execute(requireActor(req), kind);
    });

    app.patch('/media/:id', async req => {
      const { id } = parse(z.object({ id: uuid }), req.params);
      return uc.update.execute(requireActor(req), id, parse(updateAssetInput, req.body).altText);
    });

    app.delete('/media/:id', async (req, reply) => {
      const { id } = parse(z.object({ id: uuid }), req.params);
      await uc.remove.execute(requireActor(req), id);
      return reply.status(204).send();
    });

    app.get('/assets/:id/:variant', async (req, reply) => {
      const { id, variant } = parse(z.object({ id: uuid, variant: z.enum(imageVariants) }), req.params);
      const q = parse(z.object({ exp: z.coerce.number().optional(), sig: z.string().optional() }), req.query);
      const object = await uc.serve.execute(id, variant, q);
      reply.header('content-type', object.contentType);
      if (object.contentLength) reply.header('content-length', object.contentLength);
      // Variant files never change, so published images can be cached for a long time.
      reply.header('cache-control', object.cacheable ? 'public, max-age=31536000, immutable' : 'private, max-age=3600');
      return reply.send(object.body);
    });
  };
}
