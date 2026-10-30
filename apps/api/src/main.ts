import { buildApp } from './app.js';
import { buildContainer } from './container.js';
import { loadConfig } from './shared/config.js';
import { createDb } from './shared/db/database.js';

const config = loadConfig();
const db = createDb(config.DATABASE_URL);
const app = await buildApp(config, buildContainer(config, db));

const shutdown = async () => {
  await app.close();
  await db.destroy();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

await app.listen({ port: config.PORT, host: '0.0.0.0' });
