#!/bin/sh
# Runs after `pnpm build` on Vercel. Production deploys bring the database schema
# up to date and make sure the platform admin exists (both are safe to repeat).
# Preview deploys leave the database alone.
set -e
if [ "$VERCEL_ENV" != "production" ]; then
  echo "Preview deploy: skipping migrations"
  exit 0
fi
export DATABASE_URL="${MIGRATION_DATABASE_URL:-$DATABASE_URL}"
MIGRATIONS_DIR=migrations node dist/scripts/migrate.js
if [ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_PASSWORD" ]; then
  JOB_DRIVER=inline STORAGE_DRIVER=memory node dist/scripts/seed.js
fi
