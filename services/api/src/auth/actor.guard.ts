import { createParamDecorator, Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import type { Actor, ActorRole } from './actor';

const ROLES: readonly ActorRole[] = ['partner', 'admin', 'customer'];

interface ActorRequest {
  headers: Record<string, string | string[] | undefined>;
  actor?: Actor;
}

/**
 * INTERIM actor seam: no sign-in exists yet, so the actor is read from the
 * `x-user-id` / `x-user-role` headers. These are spoofable and must be replaced
 * by real authentication before release. This file is the only place to change.
 *
 * The guard never rejects: it attaches the actor when present and the service
 * decides (401 with no actor, 403 for the wrong role).
 */
@Injectable()
export class ActorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<ActorRequest>();
    const id = req.headers['x-user-id'];
    const role = req.headers['x-user-role'];
    if (typeof id === 'string' && id.trim() !== '' && typeof role === 'string' && ROLES.includes(role as ActorRole)) {
      req.actor = { id: id.trim(), role: role as ActorRole };
    }
    return true;
  }
}

export const CurrentActor = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Actor | null => context.switchToHttp().getRequest<ActorRequest>().actor ?? null,
);
