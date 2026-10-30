import type { FastifyError, FastifyInstance } from 'fastify';
import { AppError } from '../errors.js';

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((err: FastifyError | AppError, req, reply) => {
    if (err instanceof AppError) {
      return reply.status(err.status).send({ error: { code: err.code, message: err.message, details: err.details } });
    }
    // Errors Fastify raises itself (bad JSON, body too large, rate limit).
    const status = (err as FastifyError).statusCode;
    if (status && status < 500) {
      return reply.status(status).send({ error: { code: (err as FastifyError).code ?? 'bad_request', message: err.message } });
    }
    req.log.error({ err }, 'unhandled error');
    return reply.status(500).send({ error: { code: 'internal', message: 'Something went wrong' } });
  });

  app.setNotFoundHandler((_req, reply) => {
    reply.status(404).send({ error: { code: 'not_found', message: 'Route not found' } });
  });
}
