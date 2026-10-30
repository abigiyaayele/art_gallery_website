# Build from the repository root: docker build -f apps/dashboard/Dockerfile .
FROM node:22-slim AS build
RUN corepack enable
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/contracts/package.json packages/contracts/
COPY apps/dashboard/package.json apps/dashboard/
RUN pnpm install --frozen-lockfile --filter @platform/dashboard...
COPY tsconfig.base.json ./
COPY packages/contracts packages/contracts
COPY apps/dashboard apps/dashboard
RUN pnpm --filter @platform/dashboard build

FROM nginx:1.27-alpine
COPY apps/dashboard/nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /repo/apps/dashboard/dist /usr/share/nginx/html
# API_UPSTREAM is where nginx forwards /api, e.g. http://api:4000
ENV API_UPSTREAM=http://api:4000
EXPOSE 80
