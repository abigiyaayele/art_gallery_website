import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDb } from '../src/shared/db/database.js';
import { migrate } from '../src/shared/db/migrate.js';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');
const here = path.dirname(fileURLToPath(import.meta.url));
const db = createDb(url);
await migrate(db, process.env.MIGRATIONS_DIR ?? path.resolve(here, '../migrations'), console.log);
await db.destroy();
console.log('migrations up to date');
