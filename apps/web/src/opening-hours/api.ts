export const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
export type Weekday = (typeof WEEKDAYS)[number]

export const WEEKDAY_NAMES: Record<Weekday, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
}

export interface Slot {
  opensAt: string
  closesAt: string
}

export interface OpeningHours {
  city: string
  timeZone: string
  temporarilyClosed: boolean
  days: Record<Weekday, { slots: Slot[] }>
}

/** The server refused a save because these weekdays have no open slots. */
export class NoSlotsError extends Error {
  constructor(readonly weekdays: Weekday[]) {
    super('Weekdays with no open time slots')
  }
}

const BASE = '/partner/restaurant'

async function request(path: string, init?: RequestInit): Promise<OpeningHours> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const missing: Weekday[] = (body?.problems ?? [])
      .filter((p: { reason: string }) => p.reason === 'NO_SLOTS')
      .map((p: { weekday: Weekday }) => p.weekday)
    if (response.status === 400 && missing.length > 0) throw new NoSlotsError(missing)
    throw new Error(`Request failed with status ${response.status}`)
  }
  return response.json()
}

export function fetchOpeningHours(): Promise<OpeningHours> {
  return request('/opening-hours')
}

export function saveOpeningHours(days: OpeningHours['days']): Promise<OpeningHours> {
  const body = { days: WEEKDAYS.map((weekday) => ({ weekday, slots: days[weekday].slots })) }
  return request('/opening-hours', { method: 'PUT', body: JSON.stringify(body) })
}

export function setTemporaryClosure(closed: boolean): Promise<OpeningHours> {
  return request('/temporary-closure', { method: 'PUT', body: JSON.stringify({ closed }) })
}
