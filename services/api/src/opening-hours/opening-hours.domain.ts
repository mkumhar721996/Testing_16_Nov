export const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type Weekday = (typeof WEEKDAYS)[number];

/** `HH:mm` in restaurant-local time; `closesAt` is exclusive. */
export interface Slot {
  opensAt: string;
  closesAt: string;
}

export type WeekHours = Record<Weekday, Slot[]>;

export interface WeekProblem {
  weekday: Weekday;
  reason: 'NO_SLOTS' | 'INVALID_SLOT' | 'OVERLAP';
}

const TIME_FORMAT = /^([01]\d|2[0-3]):[0-5]\d$/;

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function emptyWeek(): WeekHours {
  return { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
}

/** Whether an order placed at `now` is inside an opening slot of the restaurant's local day. */
export function isOpenAt(hours: WeekHours, temporarilyClosed: boolean, now: Date, timeZone: string): boolean {
  if (temporarilyClosed) return false;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const part = (type: string): string => parts.find((p) => p.type === type)?.value ?? '';
  const weekday = part('weekday').toLowerCase() as Weekday;
  const minutes = Number(part('hour')) * 60 + Number(part('minute'));
  return (hours[weekday] ?? []).some((s) => toMinutes(s.opensAt) <= minutes && minutes < toMinutes(s.closesAt));
}

/** One problem per offending weekday: no slots, a malformed slot, or overlapping slots. */
export function validateWeek(hours: WeekHours): WeekProblem[] {
  const problems: WeekProblem[] = [];
  for (const weekday of WEEKDAYS) {
    const slots = hours[weekday] ?? [];
    if (slots.length === 0) {
      problems.push({ weekday, reason: 'NO_SLOTS' });
    } else if (slots.some((s) => !TIME_FORMAT.test(s.opensAt) || !TIME_FORMAT.test(s.closesAt) || toMinutes(s.closesAt) <= toMinutes(s.opensAt))) {
      problems.push({ weekday, reason: 'INVALID_SLOT' });
    } else {
      const sorted = [...slots].sort((a, b) => toMinutes(a.opensAt) - toMinutes(b.opensAt));
      const overlaps = sorted.some((s, i) => i > 0 && toMinutes(s.opensAt) < toMinutes(sorted[i - 1].closesAt));
      if (overlaps) problems.push({ weekday, reason: 'OVERLAP' });
    }
  }
  return problems;
}
