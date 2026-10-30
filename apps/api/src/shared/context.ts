import type { Role } from '@platform/contracts';

/** The signed-in user, bound to one workspace (tenant) for the request. */
export interface Actor {
  userId: string;
  tenantId: string | null;
  role: Role | null;
  isPlatformAdmin: boolean;
}

/** An actor that is known to be acting inside a tenant. */
export interface TenantActor extends Actor {
  tenantId: string;
  role: Role;
}
