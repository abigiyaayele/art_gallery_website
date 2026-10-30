import { z } from 'zod';
import { email, password } from './auth.js';
import { slug } from './common.js';

export const hostname = z
  .string()
  .trim()
  .toLowerCase()
  .max(253)
  .regex(/^(?=.{1,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))*$/, 'Not a valid hostname');

export const onboardTenantInput = z.object({
  name: z.string().trim().min(1).max(120),
  slug,
  owner: z.object({
    email,
    name: z.string().trim().min(1).max(120),
    password,
  }),
  themeKey: z.string().min(1).max(40).default('minimal'),
});
export type OnboardTenantInput = z.infer<typeof onboardTenantInput>;

export const addDomainInput = z.object({ hostname, isPrimary: z.boolean().default(false) });

export interface TenantDto {
  id: string;
  slug: string;
  name: string;
  status: 'active' | 'suspended';
  aiMonthlyTokenLimit: number;
  createdAt: string;
}

export interface DomainDto {
  id: string;
  hostname: string;
  isPrimary: boolean;
  isPlatformSubdomain: boolean;
  createdAt: string;
}
