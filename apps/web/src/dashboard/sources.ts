import type { IndexQuote, IpoItem, SipData, WatchlistItem } from './content'
import type { Period, SectionSource } from './types'

// Endpoints and response shapes are owned by the sibling epics (Market data and
// indices, SIP management, Watchlist and stock buying, IPO listings); the URLs
// below are assumptions to be aligned with them.
async function getJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`${url} responded ${response.status}`)
  return (await response.json()) as T
}

const listSource = <T>(url: string): SectionSource<T[]> => ({
  load: (signal) => getJson<T[]>(url, signal),
  isEmpty: (data) => data.length === 0,
})

export interface DashboardSources {
  index: SectionSource<IndexQuote[]>
  sip: SectionSource<SipData>
  watchlist: SectionSource<WatchlistItem[]>
  ipo: SectionSource<IpoItem[]>
}

export const dashboardSources: DashboardSources = {
  index: {
    load: (signal, { period }: { period: Period }) =>
      getJson<IndexQuote[]>(`/api/indices?period=${encodeURIComponent(period)}`, signal),
    isEmpty: (data) => data.length === 0,
  },
  sip: {
    load: (signal) => getJson<SipData>('/api/sips', signal),
    isEmpty: (data) => data.items.length === 0,
  },
  watchlist: listSource<WatchlistItem>('/api/watchlist'),
  ipo: listSource<IpoItem>('/api/ipos'),
}
