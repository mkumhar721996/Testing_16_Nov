import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import ListingApprovalsPage from './ListingApprovalsPage'

const queue = [
  { id: 'l1', name: 'Saffron & Spice', cuisine: 'Indian', addressCity: '12 High Street, Leeds', description: 'd', status: 'pending' },
  { id: 'l2', name: 'Bella Napoli', cuisine: 'Italian', addressCity: '5 Mill Lane, York', description: 'd', status: 'pending' },
]

type Reply = { status: number; body?: unknown }
function mockFetch(...replies: Reply[]) {
  const fn = vi.fn((..._args: [string, RequestInit?]) => {
    const { status, body } = replies.shift() ?? { status: 500 }
    return Promise.resolve(new Response(JSON.stringify(body ?? {}), { status }))
  })
  vi.stubGlobal('fetch', fn)
  return fn
}

afterEach(() => vi.unstubAllGlobals())

describe('ListingApprovalsPage', () => {
  it('lists pending listings', async () => {
    mockFetch({ status: 200, body: queue })
    render(<ListingApprovalsPage />)
    expect(await screen.findByText('Saffron & Spice')).toBeInTheDocument()
    expect(screen.getByText('Italian, 5 Mill Lane, York')).toBeInTheDocument()
  })

  it('shows an empty state when nothing is pending', async () => {
    mockFetch({ status: 200, body: [] })
    render(<ListingApprovalsPage />)
    expect(await screen.findByRole('heading', { name: 'Nothing to review' })).toBeInTheDocument()
  })

  it('approves a listing (AC 4)', async () => {
    const fetchMock = mockFetch({ status: 200, body: queue }, { status: 200, body: { ...queue[0], status: 'approved' } })
    render(<ListingApprovalsPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Approve Saffron & Spice' }))
    expect(await screen.findByText('Saffron & Spice is approved and now visible to customers.')).toBeInTheDocument()
    const [url, init] = fetchMock.mock.calls[1]
    expect(url).toBe('/admin/restaurant-listings/l1/approve')
    expect(init?.method).toBe('POST')
    fireEvent.click(screen.getByRole('button', { name: 'Back to queue' }))
    expect(screen.queryByText('Saffron & Spice')).not.toBeInTheDocument()
    expect(screen.getByText('Bella Napoli')).toBeInTheDocument()
  })

  it('rejects a listing (AC 5)', async () => {
    const fetchMock = mockFetch({ status: 200, body: queue }, { status: 200, body: { ...queue[0], status: 'rejected' } })
    render(<ListingApprovalsPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Reject Saffron & Spice' }))
    expect(
      await screen.findByText(
        'Saffron & Spice is rejected. It stays hidden from customers until the partner edits and resubmits it.',
      ),
    ).toBeInTheDocument()
    expect(fetchMock.mock.calls[1][0]).toBe('/admin/restaurant-listings/l1/reject')
  })

  it('shows "Admins only" when the API refuses (AC 7, 8)', async () => {
    mockFetch({ status: 200, body: queue }, { status: 403 })
    render(<ListingApprovalsPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Approve Saffron & Spice' }))
    expect(await screen.findByRole('heading', { name: 'Admins only' })).toBeInTheDocument()
  })
})
