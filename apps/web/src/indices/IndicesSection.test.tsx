import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { FeedProvider } from '../market/feedContext'
import type { IndexSeries, MarketFeed, Period } from '../market/marketFeed'
import { IndicesSection } from './IndicesSection'

const make = (period: Period): IndexSeries[] => {
  const w = period === '1W'
  return [
    { id: 'nifty50', name: 'Nifty 50', value: 22000, points: [21900, 22000] },
    { id: 'sensex', name: 'Sensex', value: 73000, points: w ? [100, 103.2] : [100, 101.5] },
    { id: 'niftybank', name: 'Nifty Bank', value: 47000, points: [47000] },
  ]
}

function setup(getIndices?: MarketFeed['getIndices']) {
  const fn = vi.fn(getIndices ?? (async (p: Period) => make(p)))
  render(
    <FeedProvider feed={{ getIndices: fn }}>
      <IndicesSection />
    </FeedProvider>,
  )
  return fn
}

describe('IndicesSection', () => {
  afterEach(() => vi.useRealTimers())

  it('shows value on each card (AC1)', async () => {
    setup()
    expect(await screen.findByRole('button', { name: /Nifty 50/ })).toHaveTextContent('22,000.00')
    expect(screen.getByRole('button', { name: /Sensex/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Nifty Bank/ })).toBeInTheDocument()
  })

  it('shows period change (AC2)', async () => {
    setup()
    expect(await screen.findByRole('button', { name: /Sensex/ })).toHaveTextContent('+1.50%')
  })

  it('charts Nifty 50 initially (AC3)', async () => {
    setup()
    const card = await screen.findByRole('button', { name: /Nifty 50/ })
    expect(screen.getByRole('img', { name: /Nifty 50 chart/ })).toBeInTheDocument()
    expect(card).toHaveAttribute('aria-pressed', 'true')
  })

  it('switches chart on card tap (AC4)', async () => {
    setup()
    fireEvent.click(await screen.findByRole('button', { name: /Sensex/ }))
    expect(await screen.findByRole('img', { name: /Sensex chart/ })).toBeInTheDocument()
  })

  it('applies a new period to cards and keeps selection (AC5)', async () => {
    const fn = setup()
    fireEvent.click(await screen.findByRole('button', { name: /Sensex/ }))
    fireEvent.change(screen.getByLabelText('Period'), { target: { value: '1W' } })
    await waitFor(() => expect(fn).toHaveBeenLastCalledWith('1W'))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Sensex/ })).toHaveTextContent('+3.20%'),
    )
    expect(screen.getByRole('img', { name: /Sensex chart/ })).toBeInTheDocument()
  })

  it('offers four periods (AC6)', async () => {
    setup()
    await screen.findByRole('button', { name: /Sensex/ })
    expect(
      within(screen.getByLabelText('Period'))
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toEqual(['1 day', '1 week', '1 month', '1 year'])
  })

  it('opens on 1 day (AC7)', async () => {
    const fn = setup()
    expect(screen.getByLabelText('Period')).toHaveValue('1D')
    await screen.findByRole('button', { name: /Sensex/ })
    expect(fn).toHaveBeenCalledWith('1D')
  })

  it.each([
    ['rejects', async () => Promise.reject(new Error('down'))],
    ['is empty', async () => []],
  ])('shows error state when feed %s and recovers (AC8)', async (_n, bad) => {
    let ok = false
    setup(async (p) => (ok ? make(p) : bad()))
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument()
    expect(screen.getByText(/couldn.t load/i)).toBeInTheDocument()
    ok = true
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('button', { name: /Nifty 50/ })).toBeInTheDocument()
  })

  it('shows a dash when there is no baseline (AC9)', async () => {
    setup()
    expect(await screen.findByRole('button', { name: /Nifty Bank/ })).toHaveTextContent('—')
  })

  it('reloads on card tap (AC10)', async () => {
    const fn = setup()
    fireEvent.click(await screen.findByRole('button', { name: /Sensex/ }))
    await waitFor(() => expect(fn).toHaveBeenCalledTimes(2))
  })

  it('does not refresh by itself (AC11)', async () => {
    vi.useFakeTimers()
    const fn = setup()
    await vi.advanceTimersByTimeAsync(0)
    const card = screen.getByRole('button', { name: /Sensex/ })
    const before = card.textContent
    await vi.advanceTimersByTimeAsync(10 * 60_000)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(card).toHaveTextContent(before as string)
  })
})
