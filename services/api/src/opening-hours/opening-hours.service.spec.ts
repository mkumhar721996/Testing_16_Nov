import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryStore } from '../testing/in-memory-store';
import { WEEKDAYS, type WeekHours } from './opening-hours.domain';
import { OpeningHoursService } from './opening-hours.service';

const rid = 'restaurant-1';

function fullWeek(overrides: Partial<WeekHours> = {}): WeekHours {
  const week = {} as WeekHours;
  for (const day of WEEKDAYS) week[day] = [{ opensAt: '18:00', closesAt: '22:00' }];
  return { ...week, ...overrides };
}

describe('OpeningHoursService', () => {
  let store: InMemoryStore;
  let service: OpeningHoursService;

  beforeEach(() => {
    store = new InMemoryStore();
    store.addRestaurant(rid, { hours: fullWeek() });
    service = new OpeningHoursService(store);
  });

  it('saves several slots for a weekday and reads them back (AC 1)', async () => {
    const slots = [{ opensAt: '11:00', closesAt: '14:30' }, { opensAt: '18:00', closesAt: '22:00' }];
    await service.saveHours(rid, fullWeek({ mon: slots }));
    expect((await service.getHours(rid)).days.mon.slots).toEqual(slots);
  });

  it('refuses a weekday with no slots and persists nothing (AC 9)', async () => {
    const before = await service.getHours(rid);
    await expect(service.saveHours(rid, fullWeek({ sun: [], mon: [{ opensAt: '09:00', closesAt: '10:00' }] }))).rejects.toBeInstanceOf(BadRequestException);
    const after = await service.getHours(rid);
    expect(after.days.sun.slots).toEqual(before.days.sun.slots);
    expect(after.days.mon.slots).toEqual(before.days.mon.slots);
  });

  it('names the weekdays that have no slots in the refusal', async () => {
    await expect(service.saveHours(rid, fullWeek({ sun: [] }))).rejects.toMatchObject({
      response: { problems: [{ weekday: 'sun', reason: 'NO_SLOTS' }] },
    });
  });

  it.each([
    ['close before open', { opensAt: '22:00', closesAt: '18:00' }],
    ['crossing midnight', { opensAt: '22:00', closesAt: '02:00' }],
  ])('refuses %s', async (_name, slot) => {
    await expect(service.saveHours(rid, fullWeek({ fri: [slot] }))).rejects.toBeInstanceOf(BadRequestException);
  });

  it('closes then reopens, keeping the saved slots (AC 2)', async () => {
    const before = await service.getHours(rid);
    expect((await service.setTemporarilyClosed(rid, true)).temporarilyClosed).toBe(true);
    await service.setTemporarilyClosed(rid, false);
    const after = await service.getHours(rid);
    expect(after.temporarilyClosed).toBe(false);
    expect(after.days).toEqual(before.days);
  });

  it('reports an unknown restaurant as not found', async () => {
    await expect(service.getHours('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
