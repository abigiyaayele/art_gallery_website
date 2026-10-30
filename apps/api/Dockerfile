# Build from the repository root: docker build -f apps/api/Dockerfile .
FROM node:22-slim AS build
RUN corepack enable
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/contracts/package.json packages/contracts/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter @platform/api...
COPY tsconfig.base.json ./
COPY packages/contracts packages/contracts
COPY apps/api apps/api
RUN pnpm --filter @platform/api build \
 && pnpm --filter @platform/api deploy --prod --legacy /out

FROM node:22-slim
ENV NODE_ENV=production MIGRATIONS_DIR=/app/migrations
WORKDIR /app
COPY --from=build /out/node_modules ./node_modules
COPY --from=build /out/package.json ./
COPY --from=build /repo/apps/api/dist ./dist
COPY apps/api/migrations ./migrations
USER node
EXPOSE 4000
# Migrations are idempotent, so every start brings the schema up to date first.
CMD ["sh", "-c", "node dist/scripts/migrate.js && node dist/src/main.js"]
