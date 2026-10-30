import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify from 'fastify';
import type { Container } from './container.js';
import { identityRoutes } from './modules/identity/presentation/routes.js';
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
  await app.register(rateLimit, { global: true, max: 300, timeWindow: '1 minute' });

  registerAuth(app, async token => {
    const claims = await container.tokens.verify(token);
    return claims && { userId: claims.userId, tenantId: claims.tenantId, role: claims.role, isPlatformAdmin: claims.isPlatformAdmin };
  });

  app.get('/health', async () => ({ ok: true }));
  await app.register(identityRoutes(container.identity, { secureCookies: config.NODE_ENV === 'production' }));
  await app.register(tenancyRoutes(container.tenancy));

  return app;
}
