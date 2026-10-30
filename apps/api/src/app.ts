import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import etag from '@fastify/etag';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import Fastify from 'fastify';
import type { Container } from './container.js';
import { analyticsRoutes } from './modules/analytics/presentation/routes.js';
import { commerceRoutes } from './modules/commerce/presentation/routes.js';
import { inquiryRoutes } from './modules/inquiries/presentation/routes.js';
import { siteRoutes } from './modules/site/presentation/routes.js';
import { publicCatalogRoutes } from './modules/catalog/presentation/public-routes.js';
import { catalogRoutes } from './modules/catalog/presentation/routes.js';
import { identityRoutes } from './modules/identity/presentation/routes.js';
import { mediaRoutes } from './modules/media/presentation/routes.js';
import { tenancyRoutes } from './modules/tenancy/presentation/routes.js';
import type { Config } from './shared/config.js';
import { registerAuth } from './shared/http/auth.js';
import { registerErrorHandler } from './shared/http/error-handler.js';

export async function buildApp(config: Config, container: Container) {
  const app = Fastify({
    logger: config.NODE_ENV === 'test' ? false : { level: config.NODE_ENV === 'production' ? 'info' : 'debug' },
    trustProxy: true,
    bodyLimit: 1024 * 1024,
  });

  registerErrorHandler(app);
  await app.register(helmet, { crossOriginResourcePolicy: { policy: 'cross-origin' } });
  await app.register(cors, {
    // The dashboard sends credentials (refresh cookie); public site routes are read-only and open.
    origin: (origin, cb) => cb(null, !origin || origin === config.DASHBOARD_ORIGIN ? (origin ?? true) : false),
    credentials: true,
  });
  await app.register(cookie);
  await app.register(etag);
  await app.register(multipart);
  await app.register(rateLimit, { global: true, max: 300, timeWindow: '1 minute' });

  registerAuth(app, async token => {
    const claims = await container.tokens.verify(token);
    return claims && { userId: claims.userId, tenantId: claims.tenantId, role: claims.role, isPlatformAdmin: claims.isPlatformAdmin };
  });

  app.get('/health', async () => ({ ok: true }));
  await app.register(identityRoutes(container.identity, { secureCookies: config.NODE_ENV === 'production' }));
  await app.register(tenancyRoutes(container.tenancy));
  await app.register(mediaRoutes(container.media));
  await app.register(catalogRoutes(container.catalog));
  await app.register(publicCatalogRoutes(container.catalog.public, container.resolver));
  await app.register(siteRoutes(container.site, container.resolver));
  await app.register(commerceRoutes(container.commerce, container.resolver));
  await app.register(inquiryRoutes(container.inquiries, container.resolver));
  await app.register(analyticsRoutes(container.analytics, container.resolver));

  return app;
}
