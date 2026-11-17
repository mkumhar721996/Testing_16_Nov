import type { RestaurantSchedule } from './menu.types';

export interface NextOpening {
  weekday: number;
  opens: string;
}

export interface OpenStatus {
  isOpen: boolean;
  closesAt: string | null;
  today: number;
  nextOpening: NextOpening | null;
}

const WEEKDAYS: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

function localNow(now: Date, timeZone: string): { weekday: number; time: string } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return { weekday: WEEKDAYS[get('weekday')], time: `${get('hour')}:${get('minute')}` };
}

/** 'HH:MM' strings compare correctly as text. Open means opens <= local time < closes. */
export function openStatus(schedule: RestaurantSchedule, now: Date): OpenStatus {
  const { weekday: today, time } = localNow(now, schedule.timezone);
  const current = schedule.slots.find((s) => s.weekday === today && s.opens <= time && time < s.closes);

  let nextOpening: NextOpening | null = null;
  for (let offset = 0; offset <= 7 && !nextOpening; offset++) {
    const weekday = ((today - 1 + offset) % 7) + 1;
    const starts = schedule.slots
      .filter((s) => s.weekday === weekday && (offset > 0 || s.opens > time))
      .map((s) => s.opens)
      .sort();
    if (starts.length) nextOpening = { weekday, opens: starts[0] };
  }

  const isOpen = !schedule.temporarilyClosed && current !== undefined;
  return { isOpen, closesAt: isOpen && current ? current.closes : null, today, nextOpening };
}
