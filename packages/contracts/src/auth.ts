import { z } from 'zod';
import { uuid } from './common.js';

export const roles = ['owner', 'editor'] as const;
export const roleSchema = z.enum(roles);
export type Role = z.infer<typeof roleSchema>;

export const email = z.string().trim().toLowerCase().email().max(254);
export const password = z.string().min(10, 'Use at least 10 characters').max(200);

export const loginInput = z.object({
  email,
  password: z.string().min(1).max(200),
  tenantId: uuid.optional(),
});
export type LoginInput = z.infer<typeof loginInput>;

export const switchTenantInput = z.object({ tenantId: uuid });

export const changePasswordInput = z.object({
  currentPassword: z.string().min(1),
  newPassword: password,
});

export const inviteMemberInput = z.object({
  email,
  name: z.string().trim().min(1).max(120),
  role: roleSchema,
  password,
});
export type InviteMemberInput = z.infer<typeof inviteMemberInput>;

export interface WorkspaceSummary {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  role: Role;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  isPlatformAdmin: boolean;
}

export interface Session {
  accessToken: string;
  expiresIn: number;
  user: SessionUser;
  /** Workspace the access token is bound to; null for a platform admin with no workspace. */
  activeTenantId: string | null;
  workspaces: WorkspaceSummary[];
}

export interface Member {
  userId: string;
  email: string;
  name: string;
  role: Role;
  joinedAt: string;
}
