import { ForbiddenException, UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { ActorGuard } from '../auth/actor.guard';
import type { Actor } from '../auth/actor';
import { AdminListingsController } from './admin-listings.controller';
import { InMemoryListingRepository } from './in-memory-listing.repository';
import { ListingService } from './listing.service';
import { RestaurantsController } from './restaurants.controller';

const partner: Actor = { id: 'p1', role: 'partner' };
const admin: Actor = { id: 'a1', role: 'admin' };
const input = { name: 'Saffron & Spice', cuisine: 'Indian', addressCity: 'Leeds', description: 'Family-run' };

function contextWith(headers: Record<string, string>) {
  const req: { headers: Record<string, string>; actor?: Actor } = { headers };
  const context = { switchToHttp: () => ({ getRequest: () => req }) } as unknown as ExecutionContext;
  return { req, context };
}

describe('restaurant controllers', () => {
  let repo: InMemoryListingRepository;
  let customers: RestaurantsController;
  let admins: AdminListingsController;

  beforeEach(() => {
    repo = new InMemoryListingRepository();
    const svc = new ListingService(repo);
    customers = new RestaurantsController(svc);
    admins = new AdminListingsController(svc);
  });

  it('creates a listing for a partner without exposing ownerId (AC 1)', async () => {
    const created = await customers.create(partner, input);
    expect(created).toMatchObject({ ...input, status: 'pending' });
    expect(created).not.toHaveProperty('ownerId');
  });

  it('refuses create with no actor (401) and for a customer (403), storing nothing (AC 6)', async () => {
    await expect(customers.create(null, input)).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(customers.create({ id: 'c1', role: 'customer' }, input)).rejects.toBeInstanceOf(ForbiddenException);
    expect(await repo.findByOwner('c1')).toBeNull();
  });

  it('GET /restaurants lists approved listings only (AC 3, 4, 5)', async () => {
    const created = await customers.create(partner, input);
    expect(await customers.visible()).toEqual([]);
    await admins.reject(admin, created.id);
    expect(await customers.visible()).toEqual([]);
    await customers.updateMine(partner, input);
    await admins.approve(admin, created.id);
    const visible = await customers.visible();
    expect(visible).toEqual([{ id: created.id, ...input }]);
  });

  it('only admins reach the queue and the decisions (AC 7, 8)', async () => {
    const created = await customers.create(partner, input);
    await expect(admins.pending(partner)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(admins.approve(partner, created.id)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(admins.reject(partner, created.id)).rejects.toBeInstanceOf(ForbiddenException);
    expect((await admins.pending(admin)).map((l) => l.id)).toEqual([created.id]);
  });
});

describe('ActorGuard', () => {
  const guard = new ActorGuard();

  it('attaches the actor from the headers', () => {
    const { req, context } = contextWith({ 'x-user-id': 'p1', 'x-user-role': 'partner' });
    expect(guard.canActivate(context)).toBe(true);
    expect(req.actor).toEqual({ id: 'p1', role: 'partner' });
  });

  it('leaves the actor unset for missing or unknown roles', () => {
    const missing = contextWith({});
    const unknown = contextWith({ 'x-user-id': 'p1', 'x-user-role': 'owner' });
    guard.canActivate(missing.context);
    guard.canActivate(unknown.context);
    expect(missing.req.actor).toBeUndefined();
    expect(unknown.req.actor).toBeUndefined();
  });
});
