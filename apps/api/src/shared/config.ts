import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(4000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  ENCRYPTION_KEY: z.string().optional(),
  DASHBOARD_ORIGIN: z.string().default('http://localhost:5173'),
  PLATFORM_DOMAIN: z.string().default('localhost'),
  /** Public base URL of this API, used to build image URLs. */
  PUBLIC_API_URL: z.string().default('http://localhost:4000'),
  STORAGE_DRIVER: z.enum(['s3', 'memory']).default('s3'),
  S3_ENDPOINT: z.string().default('http://localhost:9000'),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY: z.string().default('minioadmin'),
  S3_SECRET_KEY: z.string().default('minioadmin'),
  S3_BUCKET: z.string().default('artist-platform'),
  /** 'inline' runs background jobs in the API process right away (tests, simple setups). */
  JOB_DRIVER: z.enum(['pgboss', 'inline']).default('pgboss'),
  /** How artist websites are reached; {host} is the tenant's primary domain. */
  SITE_URL_TEMPLATE: z.string().default('https://{host}'),
  CHAPA_API_URL: z.string().default('https://api.chapa.co/v1'),
  /** Turns the AI assistant on. Without it the assistant answers that it is not set up. */
  ANTHROPIC_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default('claude-opus-5-5'),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().default(15 * 60),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().default(30),
});

export type Config = z.infer<typeof schema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n  ');
    throw new Error(`Invalid configuration:\n  ${issues}`);
  }
  return parsed.data;
}
