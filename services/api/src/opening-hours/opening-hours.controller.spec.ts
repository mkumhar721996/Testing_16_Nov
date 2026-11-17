import type { ExecutionContext } from '@nestjs/common';
import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { PartnerGuard, type Principal, type PartnerRequest } from '../auth/partner.guard';
import { InMemoryStore } from '../testing/in-memory-store';
import { OpeningHoursController, type SaveHoursBody } from './opening-hours.controller';
import { WEEKDAYS } from './opening-hours.domain';
import { OpeningHoursService } from './opening-hours.service';

const evening = [{ opensAt: '18:00', closesAt: '22:00' }];
const fullBody = (): SaveHoursBody => ({ days: WEEKDAYS.map((weekday) => ({ weekday, slots: evening })) });

function contextFor(request: PartnerRequest): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

describe('OpeningHoursController', () => {
  let store: InMemoryStore;
  let controller: OpeningHoursController;

  beforeEach(() => {
    store = new InMemoryStore();
    store.addRestaurant('mine');
    store.addRestaurant('other');
    controller = new OpeningHoursController(new OpeningHoursService(store));
  });

  it('saves two slots for Monday and reads them back (AC 1)', async () => {
    const slots = [{ opensAt: '11:00', closesAt: '14:30' }, ...evening];
    const body = fullBody();
    body.days[0] = { weekday: 'mon', slots };
    await controller.save({ restaurantId: 'mine' }, body);
    expect((await controller.get({ restaurantId: 'mine' })).days.mon.slots).toEqual(slots);
  });

  it('refuses a body where a weekday has no slots (AC 9)', async () => {
    const body = fullBody();
    body.days[6] = { weekday: 'sun', slots: [] };
    await expect(controller.save({ restaurantId: 'mine' }, body)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses a body that leaves a weekday out', async () => {
    const body = fullBody();
    body.days.pop();
    await expect(controller.save({ restaurantId: 'mine' }, body)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('closes and reopens the partner’s own restaurant only (AC 2)', async () => {
    await controller.setClosure({ restaurantId: 'mine' }, { closed: true });
    expect(store.restaurants.get('mine')!.temporarilyClosed).toBe(true);
    expect(store.restaurants.get('other')!.temporarilyClosed).toBe(false);
    expect((await controller.setClosure({ restaurantId: 'mine' }, { closed: false })).temporarilyClosed).toBe(false);
  });

  it('refuses a non-boolean closed flag', async () => {
    await expect(controller.setClosure({ restaurantId: 'mine' }, { closed: 'yes' as unknown as boolean })).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('PartnerGuard', () => {
  const guardFor = (principal: Principal | null) => new PartnerGuard({ resolve: async () => principal });

  it('answers 401 when nobody is signed in', async () => {
    await expect(guardFor(null).canActivate(contextFor({}))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('answers 403 for a signed-in customer', async () => {
    await expect(guardFor({ role: 'customer', tenantId: 't' }).canActivate(contextFor({}))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('attaches the partner’s own restaurant to the request', async () => {
    const request: PartnerRequest = {};
    await expect(guardFor({ role: 'partner', tenantId: 't', restaurantId: 'mine' }).canActivate(contextFor(request))).resolves.toBe(true);
    expect(request.restaurantId).toBe('mine');
  });
});
