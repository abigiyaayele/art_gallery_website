import fs from 'node:fs/promises';
import path from 'node:path';
import { sql } from 'kysely';
import type { Db } from './database.js';

/**
 * Applies migrations/*.sql in name order, each in its own transaction, and
 * records them in schema_migrations. Plain SQL keeps the schema readable.
 */
export async function migrate(db: Db, dir: string, log: (msg: string) => void = () => {}) {
  await sql`CREATE TABLE IF NOT EXISTS schema_migrations (
    name text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`.execute(db);

  const applied = new Set(
    (await sql<{ name: string }>`SELECT name FROM schema_migrations`.execute(db)).rows.map(r => r.name),
  );
  const files = (await fs.readdir(dir)).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const body = await fs.readFile(path.join(dir, file), 'utf8');
    await db.transaction().execute(async trx => {
      await sql.raw(body).execute(trx);
      await sql`INSERT INTO schema_migrations (name) VALUES (${file})`.execute(trx);
    });
    log(`applied ${file}`);
  }
}
