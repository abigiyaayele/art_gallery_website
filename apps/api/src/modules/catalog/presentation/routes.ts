import { artworkInput, artworkListQuery, artworkUpdateInput, bulkArtworkInput, categoryInput, uuid } from '@platform/contracts';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireActor } from '../../../shared/http/auth.js';
import { parse } from '../../../shared/http/validate.js';
import type {
  BulkUpdateArtworks,
  ChangeArtworkStatus,
  CreateArtwork,
  DeleteArtwork,
  DeleteCategory,
  GetArtwork,
  ListArtworks,
  ListCategories,
  SaveCategory,
  UpdateArtwork,
} from '../application/use-cases.js';

export interface CatalogUseCases {
  create: CreateArtwork;
  update: UpdateArtwork;
  remove: DeleteArtwork;
  status: ChangeArtworkStatus;
  bulk: BulkUpdateArtworks;
  get: GetArtwork;
  list: ListArtworks;
  listCategories: ListCategories;
  saveCategory: SaveCategory;
  deleteCategory: DeleteCategory;
}

const idParam = z.object({ id: uuid });

export function catalogRoutes(uc: CatalogUseCases) {
  return async (app: FastifyInstance) => {
    app.get('/artworks', async req => uc.list.execute(requireActor(req), parse(artworkListQuery, req.query)));
    app.post('/artworks', async (req, reply) => reply.status(201).send(await uc.create.execute(requireActor(req), parse(artworkInput, req.body))));
    app.post('/artworks/bulk', async req => uc.bulk.execute(requireActor(req), parse(bulkArtworkInput, req.body)));
    app.get('/artworks/:id', async req => uc.get.execute(requireActor(req), parse(idParam, req.params).id));
    app.patch('/artworks/:id', async req =>
      uc.update.execute(requireActor(req), parse(idParam, req.params).id, parse(artworkUpdateInput, req.body)),
    );
    app.delete('/artworks/:id', async (req, reply) => {
      await uc.remove.execute(requireActor(req), parse(idParam, req.params).id);
      return reply.status(204).send();
    });
    for (const action of ['publish', 'unpublish', 'mark_sold', 'revert_sold'] as const) {
      app.post(`/artworks/:id/${action.replace('_', '-')}`, async req => uc.status.execute(requireActor(req), parse(idParam, req.params).id, action));
    }

    app.get('/categories', async req => uc.listCategories.execute(requireActor(req)));
    app.post('/categories', async (req, reply) =>
      reply.status(201).send(await uc.saveCategory.execute(requireActor(req), parse(categoryInput, req.body))),
    );
    app.put('/categories/:id', async req =>
      uc.saveCategory.execute(requireActor(req), parse(categoryInput, req.body), parse(idParam, req.params).id),
    );
    app.delete('/categories/:id', async (req, reply) => {
      await uc.deleteCategory.execute(requireActor(req), parse(idParam, req.params).id);
      return reply.status(204).send();
    });
  };
}
