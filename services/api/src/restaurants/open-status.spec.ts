import { describe, expect, it } from 'vitest';
import type { RestaurantSchedule } from './menu.types';
import { openStatus } from './open-status';

// 2026-11-20 is a Friday; London is UTC in November.
const schedule: RestaurantSchedule = {
  timezone: 'Europe/London',
  temporarilyClosed: false,
  slots: [{ weekday: 5, opens: '18:00', closes: '22:00' }],
};

describe('openStatus', () => {
  it('is open inside a slot and not temporarily closed (AC 8)', () => {
    expect(openStatus(schedule, new Date('2026-11-20T19:00:00Z'))).toEqual({
      isOpen: true,
      closesAt: '22:00',
      today: 5,
      nextOpening: { weekday: 5, opens: '18:00' },
    });
  });

  it('treats the closing time as exclusive and other weekdays as closed', () => {
    expect(openStatus(schedule, new Date('2026-11-20T22:00:00Z')).isOpen).toBe(false);
    expect(openStatus(schedule, new Date('2026-11-20T17:59:00Z')).isOpen).toBe(false);
    expect(openStatus(schedule, new Date('2026-11-21T19:00:00Z')).isOpen).toBe(false);
  });

  it('reports the next opening after the local now', () => {
    const withSaturday = { ...schedule, slots: [...schedule.slots, { weekday: 6, opens: '17:00', closes: '23:00' }] };
    const r = openStatus(withSaturday, new Date('2026-11-20T23:00:00Z'));
    expect(r).toMatchObject({ isOpen: false, closesAt: null, nextOpening: { weekday: 6, opens: '17:00' } });
    expect(openStatus({ ...schedule, slots: [] }, new Date('2026-11-20T19:00:00Z')).nextOpening).toBeNull();
  });

  it('is closed when temporarily closed even inside a slot (AC 9)', () => {
    const r = openStatus({ ...schedule, temporarilyClosed: true }, new Date('2026-11-20T19:00:00Z'));
    expect(r.isOpen).toBe(false);
    expect(r.closesAt).toBeNull();
  });

  it('uses the restaurant timezone', () => {
    const now = new Date('2026-11-20T19:00:00Z');
    expect(openStatus(schedule, now).isOpen).toBe(true);
    expect(openStatus({ ...schedule, timezone: 'Asia/Tokyo' }, now).isOpen).toBe(false);
  });
});
