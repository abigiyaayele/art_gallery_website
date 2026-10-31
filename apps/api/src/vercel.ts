import type { IncomingMessage, ServerResponse } from 'node:http';
import type { FastifyInstance } from 'fastify';
import { buildApp } from './app.js';
import { buildContainer, defaultInfrastructure } from './container.js';
import { loadConfig } from './shared/config.js';
import { createDb } from './shared/db/database.js';

/**
 * Entry point for running the API as a Vercel function. One app is built per
 * function instance and reused across requests. There is no long-running
 * worker on Vercel, so background jobs (image variants) run inline by default.
 */
let ready: Promise<FastifyInstance> | undefined;

async function init() {
  const config = loadConfig({ JOB_DRIVER: 'inline', ...process.env });
  // Each function instance keeps only a couple of connections; the database pooler does the rest.
  const db = createDb(config.DATABASE_URL, 2);
  const container = buildContainer(config, db, defaultInfrastructure(config));
  const app = await buildApp(config, container);
  await app.ready();
  return app;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await (ready ??= init().catch(error => {
    ready = undefined;
    throw error;
  }));
  app.server.emit('request', req, res);
}
