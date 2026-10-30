import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Actor } from '../context.js';
import { UnauthorizedError } from '../errors.js';

declare module 'fastify' {
  interface FastifyRequest {
    actor?: Actor;
  }
}

/** Reads the bearer token on every request; routes that need a user call requireActor. */
export function registerAuth(app: FastifyInstance, verify: (token: string) => Promise<Actor | undefined>) {
  app.decorateRequest('actor', undefined);
  app.addHook('onRequest', async req => {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) req.actor = await verify(header.slice(7));
  });
}

export function requireActor(req: FastifyRequest): Actor {
  if (!req.actor) throw new UnauthorizedError();
  return req.actor;
}
