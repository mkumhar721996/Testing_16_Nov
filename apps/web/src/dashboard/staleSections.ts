import type { SectionId } from './types'

export type DashboardAction = 'buy' | 'apply' | 'add-stock' | 'start-sip'

export const AFFECTED: Record<DashboardAction, SectionId[]> = {
  buy: ['watchlist'],
  apply: ['ipo'],
  'add-stock': ['watchlist'],
  'start-sip': ['sip'],
}

const stale = new Set<SectionId>()

// Sibling flows call this when a Buy, Apply, Add stock or Start a SIP action finishes.
export function markStale(action: DashboardAction): void {
  AFFECTED[action].forEach((id) => stale.add(id))
}

// Returns the sections to reload and clears the registry.
export function takeStale(): SectionId[] {
  const ids = [...stale]
  stale.clear()
  return ids
}
