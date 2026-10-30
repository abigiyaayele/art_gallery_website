import type { Role } from '@platform/contracts';
import { ForbiddenError, UnauthorizedError } from '../errors.js';
import type { Actor, TenantActor } from '../context.js';

/**
 * What each workspace role may do. Use cases check permissions here instead
 * of routes checking roles, so the rules live in one place.
 */
const grants = {
  owner: [
    'workspace:read',
    'workspace:manage',
    'members:manage',
    'domains:manage',
    'payments:manage',
    'artwork:write',
    'artwork:publish',
    'site:write',
    'orders:manage',
    'ai:use',
  ],
  editor: ['workspace:read', 'artwork:write', 'artwork:publish', 'site:write', 'orders:manage', 'ai:use'],
} as const satisfies Record<Role, readonly string[]>;

export type Permission = (typeof grants)['owner'][number];

export function can(actor: Actor, permission: Permission): boolean {
  if (!actor.tenantId || !actor.role) return false;
  return (grants[actor.role] as readonly string[]).includes(permission);
}

/** Narrows the actor to one inside a workspace that holds the permission. */
export function assertCan(actor: Actor, permission: Permission): asserts actor is TenantActor {
  if (!actor.tenantId) throw new ForbiddenError('Choose a workspace first');
  if (!can(actor, permission)) throw new ForbiddenError();
}

export function assertPlatformAdmin(actor: Actor | undefined): asserts actor is Actor {
  if (!actor) throw new UnauthorizedError();
  if (!actor.isPlatformAdmin) throw new ForbiddenError();
}
