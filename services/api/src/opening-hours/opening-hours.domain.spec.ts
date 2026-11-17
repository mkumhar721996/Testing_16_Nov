import { describe, expect, it } from 'vitest';
import { isOpenAt, validateWeek, WEEKDAYS, type Slot, type Weekday, type WeekHours } from './opening-hours.domain';

const evening: Slot[] = [{ opensAt: '18:00', closesAt: '22:00' }];

function fullWeek(overrides: Partial<WeekHours> = {}): WeekHours {
  const week = {} as WeekHours;
  for (const day of WEEKDAYS) week[day] = [...evening];
  return { ...week, ...overrides };
}

const bogota = 'America/Bogota';
const hours = fullWeek();

describe('isOpenAt', () => {
  it('accepts 18:30 local in a UTC-5 city (AC 5, 7)', () => {
    expect(isOpenAt(hours, false, new Date('2026-11-17T23:30:00Z'), bogota)).toBe(true);
  });

  it('includes the start and excludes the end (AC 8)', () => {
    expect(isOpenAt(hours, false, new Date('2026-11-17T23:00:00Z'), bogota)).toBe(true);
    expect(isOpenAt(hours, false, new Date('2026-11-18T03:00:00Z'), bogota)).toBe(false);
  });

  it('refuses outside every slot (AC 6)', () => {
    expect(isOpenAt(hours, false, new Date('2026-11-17T20:00:00Z'), bogota)).toBe(false);
  });

  it('refuses inside a slot when temporarily closed (AC 4)', () => {
    expect(isOpenAt(hours, true, new Date('2026-11-17T23:30:00Z'), bogota)).toBe(false);
  });

  it('uses the restaurant-local weekday, not the UTC weekday', () => {
    // Tuesday 22:30 in Bogota is already Wednesday in UTC.
    const week = fullWeek({ tue: [{ opensAt: '18:00', closesAt: '23:00' }], wed: [] });
    expect(isOpenAt(week, false, new Date('2026-11-18T03:30:00Z'), bogota)).toBe(true);
  });

  it('matches any of several slots in a day', () => {
    const week = fullWeek({ tue: [{ opensAt: '11:00', closesAt: '14:30' }, ...evening] });
    expect(isOpenAt(week, false, new Date('2026-11-17T17:00:00Z'), bogota)).toBe(true);
  });
});

describe('validateWeek', () => {
  it('accepts a full valid week', () => {
    expect(validateWeek(fullWeek())).toEqual([]);
  });

  it('refuses a weekday with no slots (AC 9)', () => {
    expect(validateWeek(fullWeek({ sun: [] }))).toEqual([{ weekday: 'sun', reason: 'NO_SLOTS' }]);
  });

  it.each([
    ['close equals open', { opensAt: '18:00', closesAt: '18:00' }],
    ['close before open (crosses midnight)', { opensAt: '18:00', closesAt: '02:00' }],
    ['bad format', { opensAt: '6pm', closesAt: '22:00' }],
  ])('refuses an invalid slot: %s', (_name, slot) => {
    expect(validateWeek(fullWeek({ mon: [slot] }))).toEqual([{ weekday: 'mon' as Weekday, reason: 'INVALID_SLOT' }]);
  });

  it('refuses overlapping slots', () => {
    const mon = [{ opensAt: '11:00', closesAt: '15:00' }, { opensAt: '14:00', closesAt: '16:00' }];
    expect(validateWeek(fullWeek({ mon }))).toEqual([{ weekday: 'mon', reason: 'OVERLAP' }]);
  });
});
