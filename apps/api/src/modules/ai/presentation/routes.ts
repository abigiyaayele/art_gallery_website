import { applyCopyInput, chatInput, describeArtworkInput, goalInput, ideasInput, journalInput, uuid } from '@platform/contracts';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireActor } from '../../../shared/http/auth.js';
import { parse } from '../../../shared/http/validate.js';
import type * as ai from '../application/use-cases.js';

interface AiUseCases {
  draftCopy: ai.DraftArtworkCopy;
  applyCopy: ai.ApplyArtworkCopy;
  dismiss: ai.DismissSuggestion;
  listSuggestions: ai.ListSuggestions;
  ideas: ai.GenerateIdeas;
  chat: ai.Chat;
  usage: ai.GetAiUsage;
  listGoals: ai.ListGoals;
  saveGoal: ai.SaveGoal;
  deleteGoal: ai.DeleteGoal;
  listJournal: ai.ListJournal;
  addJournal: ai.AddJournalEntry;
  deleteJournal: ai.DeleteJournalEntry;
  weeklySummary: ai.WriteWeeklySummary;
}

const idParam = z.object({ id: uuid });

export function aiRoutes(uc: AiUseCases) {
  return async (app: FastifyInstance) => {
    // Model calls cost money; keep a lid on bursts per user on top of the monthly allowance.
    const aiLimit = { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } };

    app.get('/ai/usage', async req => uc.usage.execute(requireActor(req)));
    app.get('/ai/suggestions', async req => {
      const q = parse(z.object({ artworkId: uuid.optional(), kind: z.enum(['artwork_copy', 'ideas']).optional() }), req.query);
      return uc.listSuggestions.execute(requireActor(req), q);
    });
    app.post('/ai/artworks/:id/copy', aiLimit, async (req, reply) => {
      const { id } = parse(idParam, req.params);
      return reply.status(201).send(await uc.draftCopy.execute(requireActor(req), id, parse(describeArtworkInput, req.body)));
    });
    app.post('/ai/suggestions/:id/apply', async req => {
      const { id } = parse(idParam, req.params);
      return uc.applyCopy.execute(requireActor(req), id, parse(applyCopyInput, req.body));
    });
    app.post('/ai/suggestions/:id/dismiss', async (req, reply) => {
      await uc.dismiss.execute(requireActor(req), parse(idParam, req.params).id);
      return reply.status(204).send();
    });
    app.post('/ai/ideas', aiLimit, async (req, reply) => reply.status(201).send(await uc.ideas.execute(requireActor(req), parse(ideasInput, req.body))));
    app.post('/ai/chat', aiLimit, async req => uc.chat.execute(requireActor(req), parse(chatInput, req.body)));

    app.get('/goals', async req => uc.listGoals.execute(requireActor(req)));
    app.post('/goals', async (req, reply) => reply.status(201).send(await uc.saveGoal.execute(requireActor(req), null, parse(goalInput, req.body))));
    app.put('/goals/:id', async req => uc.saveGoal.execute(requireActor(req), parse(idParam, req.params).id, parse(goalInput, req.body)));
    app.delete('/goals/:id', async (req, reply) => {
      await uc.deleteGoal.execute(requireActor(req), parse(idParam, req.params).id);
      return reply.status(204).send();
    });

    app.get('/journal', async req => uc.listJournal.execute(requireActor(req)));
    app.post('/journal', async (req, reply) => reply.status(201).send(await uc.addJournal.execute(requireActor(req), parse(journalInput, req.body).body)));
    app.delete('/journal/:id', async (req, reply) => {
      await uc.deleteJournal.execute(requireActor(req), parse(idParam, req.params).id);
      return reply.status(204).send();
    });
    app.post('/journal/weekly-summary', aiLimit, async (req, reply) => reply.status(201).send(await uc.weeklySummary.execute(requireActor(req))));
  };
}
