import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { DashboardPage } from './DashboardPage'
import { markStale, takeStale } from './staleSections'
import type { DashboardSources } from './sources'

const user = { name: 'Anika Kapoor', email: 'anika.kapoor@example.com' }
const INDEX = [{ name: 'NIFTY 50', value: '24,318.40', change: '+0.82%' }]
const SIP = {
  summary: { invested: '₹1,25,000', currentValue: '₹1,38,420', returnPct: '+10.7%' },
  items: [{ fund: 'Flexi Cap Fund', plan: '₹3,000, monthly', return: '+9.8%' }],
}
const WATCH = [{ symbol: 'TCS', name: 'Tata Consultancy', price: '4,012.35', change: '+0.36%' }]
const IPO = [
  { company: 'Alpha Logistics Ltd', dates: '18–20 Nov', band: '240–255', size: '₹1,200 cr', lot: '58', status: 'Open' },
]

type Load<T> = () => Promise<T>
function makeSources(over: {
  index?: Load<typeof INDEX>
  sip?: Load<typeof SIP>
  watchlist?: Load<typeof WATCH>
  ipo?: Load<typeof IPO>
} = {}) {
  const sources: DashboardSources = {
    index: { load: vi.fn(over.index ?? (async () => INDEX)), isEmpty: (d) => d.length === 0 },
    sip: { load: vi.fn(over.sip ?? (async () => SIP)), isEmpty: (d) => d.items.length === 0 },
    watchlist: { load: vi.fn(over.watchlist ?? (async () => WATCH)), isEmpty: (d) => d.length === 0 },
    ipo: { load: vi.fn(over.ipo ?? (async () => IPO)), isEmpty: (d) => d.length === 0 },
  }
  return sources
}
const fail = async () => {
  throw new Error('down')
}
const sipEmpty = async () => ({ ...SIP, items: [] })
const region = (name: string) => screen.getByRole('region', { name })
const WHOLE_EMPTY = 'No stocks or SIPs yet'

const renderPage = (sources: DashboardSources) =>
  render(<DashboardPage user={user} sources={sources} />)

describe('DashboardPage', () => {
  afterEach(() => takeStale())

  it('shows all four sections under the top bar (AC1, AC14)', async () => {
    renderPage(makeSources())
    await screen.findByText('Alpha Logistics Ltd')
    await screen.findByText('Tata Consultancy')
    await screen.findByText('NIFTY 50')
    await screen.findByText('Flexi Cap Fund')
    expect(screen.getByRole('heading', { name: 'Market indices' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'SIP summary' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Watchlist' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'IPO details' })).toBeInTheDocument()
    const bar = screen.getByRole('banner')
    expect(
      bar.compareDocumentPosition(screen.getByRole('heading', { name: 'Dashboard', level: 1 })) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(within(bar).getByText('Market Dashboard')).toBeInTheDocument()
  })

  it('shows loading per section, independently (AC4)', async () => {
    renderPage(makeSources({ ipo: () => new Promise(() => {}) }))
    await screen.findByText('Tata Consultancy')
    expect(within(region('IPO details')).getByRole('status')).toBeInTheDocument()
  })

  it('puts the period selector in the page head and reloads only the index (AC19)', async () => {
    const sources = makeSources()
    renderPage(sources)
    await screen.findByRole('heading', { name: 'Watchlist' })
    fireEvent.change(screen.getByRole('combobox', { name: 'Period' }), { target: { value: '1 year' } })
    await waitFor(() =>
      expect(sources.index.load).toHaveBeenLastCalledWith(expect.anything(), { period: '1 year' }),
    )
    expect(sources.watchlist.load).toHaveBeenCalledTimes(1)
  })

  it('Try again reloads only that section (AC9, AC15, AC5)', async () => {
    const sources = makeSources({ index: fail, watchlist: fail })
    renderPage(sources)
    await screen.findByText('Market indices could not be loaded')
    await screen.findByText('Watchlist could not be loaded')
    expect(screen.getByRole('alert')).toHaveTextContent('2 of 4 sections could not be loaded')
    ;(sources.index.load as ReturnType<typeof vi.fn>).mockResolvedValue(INDEX)
    fireEvent.click(within(region('Market indices')).getByRole('button', { name: 'Try again' }))
    expect(within(region('Market indices')).getByRole('status')).toBeInTheDocument()
    expect(await screen.findByText('NIFTY 50')).toBeInTheDocument()
    expect(within(region('Watchlist')).getByText('Watchlist could not be loaded')).toBeInTheDocument()
    expect(sources.watchlist.load).toHaveBeenCalledTimes(1)
  })

  it('keeps error and only Try again after 10 failures; the 11th starts a reload (AC6, AC7, AC8)', async () => {
    const sources = makeSources({ watchlist: fail })
    renderPage(sources)
    await screen.findByText('Watchlist could not be loaded')
    for (let i = 0; i < 10; i++) {
      fireEvent.click(within(region('Watchlist')).getByRole('button', { name: 'Try again' }))
      await waitFor(() =>
        expect(within(region('Watchlist')).getByRole('button', { name: 'Try again' })).toBeInTheDocument(),
      )
    }
    const watchlist = region('Watchlist')
    expect(watchlist.querySelectorAll('.alert')).toHaveLength(1)
    expect(within(watchlist).getAllByRole('button')).toHaveLength(1)
    fireEvent.click(within(watchlist).getByRole('button', { name: 'Try again' }))
    expect(within(region('Watchlist')).getByRole('status')).toBeInTheDocument()
    expect(sources.watchlist.load).toHaveBeenCalledTimes(12)
  })

  it('shows the whole-dashboard empty state when watchlist and SIPs are empty (AC10)', async () => {
    renderPage(makeSources({ watchlist: async () => [], sip: sipEmpty }))
    expect(await screen.findByText(WHOLE_EMPTY)).toBeInTheDocument()
  })

  it('does not show it while either is loading', async () => {
    renderPage(makeSources({ watchlist: async () => [], sip: () => new Promise(() => {}) }))
    await screen.findByText('Your watchlist is empty')
    expect(screen.queryByText(WHOLE_EMPTY)).not.toBeInTheDocument()
  })

  it('does not show it when watchlist errored and SIPs are empty (AC11)', async () => {
    renderPage(makeSources({ watchlist: fail, sip: sipEmpty }))
    await screen.findByText('Watchlist could not be loaded')
    await screen.findByText('No SIPs yet')
    expect(screen.queryByText(WHOLE_EMPTY)).not.toBeInTheDocument()
  })

  it('does not show it when SIPs errored and watchlist is empty (AC12)', async () => {
    renderPage(makeSources({ watchlist: async () => [], sip: fail }))
    await screen.findByText('SIP summary could not be loaded')
    await screen.findByText('Your watchlist is empty')
    expect(screen.queryByText(WHOLE_EMPTY)).not.toBeInTheDocument()
  })

  it('shows the SIP section empty state when only SIPs are empty (AC13, AC16)', async () => {
    renderPage(makeSources({ sip: sipEmpty }))
    await screen.findByRole('heading', { name: 'Watchlist' })
    expect(screen.queryByText(WHOLE_EMPTY)).not.toBeInTheDocument()
    expect(within(region('SIP summary')).getByText('No SIPs yet')).toBeInTheDocument()
  })

  it('shows the watchlist empty state when only the watchlist is empty (AC17)', async () => {
    renderPage(makeSources({ watchlist: async () => [] }))
    await screen.findByRole('heading', { name: 'SIP summary' })
    expect(within(region('Watchlist')).getByText('Your watchlist is empty')).toBeInTheDocument()
  })

  it.each([
    ['buy', 'watchlist'],
    ['apply', 'ipo'],
    ['add-stock', 'watchlist'],
    ['start-sip', 'sip'],
  ] as const)('reloads only the sections affected by %s (AC20)', async (action, affected) => {
    markStale(action)
    const sources = makeSources()
    renderPage(sources)
    await screen.findByRole('heading', { name: 'IPO details' })
    await waitFor(() => expect(sources[affected].load).toHaveBeenCalledTimes(2))
    for (const id of ['index', 'sip', 'watchlist', 'ipo'] as const) {
      if (id !== affected) expect(sources[id].load).toHaveBeenCalledTimes(1)
    }
    expect(takeStale()).toEqual([])
  })

  it('reloads stale sections when the tab becomes visible again (AC20)', async () => {
    const sources = makeSources()
    renderPage(sources)
    await screen.findByRole('heading', { name: 'IPO details' })
    markStale('apply')
    document.dispatchEvent(new Event('visibilitychange'))
    await waitFor(() => expect(sources.ipo.load).toHaveBeenCalledTimes(2))
    expect(sources.watchlist.load).toHaveBeenCalledTimes(1)
  })
})
