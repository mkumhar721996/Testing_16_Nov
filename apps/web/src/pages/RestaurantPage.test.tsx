import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import RestaurantPage from './RestaurantPage'

const item = { id: 'i1', name: 'Onion bhaji', description: 'Crisp.', price: 4.5, available: true, sizes: [] }
const page = {
  id: 'r1',
  name: 'Saffron & Spice',
  cuisine: 'Indian',
  addressCity: 'Leeds',
  description: 'Family-run Indian kitchen.',
  isOpen: true,
  temporarilyClosed: false,
  closesAt: '22:00',
  today: 5,
  nextOpening: { weekday: 5, opens: '18:00' },
  hours: [
    { weekday: 5, opens: '18:00', closes: '22:00' },
    { weekday: 6, opens: '12:00', closes: '14:00' },
    { weekday: 6, opens: '18:00', closes: '22:00' },
  ],
  categories: [
    { id: 'c1', name: 'Starters', items: [item] },
    {
      id: 'c2',
      name: 'Mains',
      items: [
        { id: 'i2', name: 'Chicken tikka masala', description: '', price: 12.5, available: true, sizes: [] },
        {
          id: 'i3',
          name: 'Lamb biryani',
          description: '',
          price: null,
          available: true,
          sizes: [
            { name: 'Regular', price: 9 },
            { name: 'Large', price: 12 },
          ],
        },
        { id: 'i4', name: 'Goan prawn curry', description: '', price: 14, available: false, sizes: [] },
      ],
    },
  ],
}

type Reply = { status: number; body?: unknown }
function mockFetch(...replies: Reply[]) {
  const fn = vi.fn((..._args: [string, RequestInit?]) => {
    const { status, body } = replies.shift() ?? { status: 500 }
    return Promise.resolve(new Response(JSON.stringify(body ?? {}), { status, headers: { 'content-type': 'application/json' } }))
  })
  vi.stubGlobal('fetch', fn)
  return fn
}

afterEach(() => vi.unstubAllGlobals())

describe('RestaurantPage', () => {
  it('shows the restaurant page for an approved restaurant (AC 1)', async () => {
    const fetchMock = mockFetch({ status: 200, body: page })
    render(<RestaurantPage id="r1" />)
    expect(await screen.findByRole('heading', { level: 1, name: 'Saffron & Spice' })).toBeInTheDocument()
    expect(fetchMock.mock.calls[0][0]).toContain('/restaurants/r1')
    expect(screen.getByText('Family-run Indian kitchen.')).toBeInTheDocument()
  })

  it('shows a not-found message and no menu on a 404 (AC 2)', async () => {
    mockFetch({ status: 404, body: { message: 'Restaurant not found' } })
    render(<RestaurantPage id="r1" />)
    expect(await screen.findByRole('heading', { name: 'Restaurant not found' })).toBeInTheDocument()
    expect(screen.queryByText('Starters')).not.toBeInTheDocument()
  })

  it('shows a retryable error when loading fails', async () => {
    mockFetch({ status: 500 }, { status: 200, body: page })
    render(<RestaurantPage id="r1" />)
    expect(await screen.findByText(/Couldn't load this restaurant/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Saffron & Spice' })).toBeInTheDocument()
  })

  it('shows each category with its items under it (AC 3)', async () => {
    mockFetch({ status: 200, body: page })
    render(<RestaurantPage id="r1" />)
    const heading = await screen.findByRole('heading', { level: 2, name: 'Mains' })
    const mains = within(heading.closest('section')!)
    expect(mains.getByText('Chicken tikka masala')).toBeInTheDocument()
    expect(mains.getByText('3 items')).toBeInTheDocument()
    expect(mains.queryByText('Onion bhaji')).not.toBeInTheDocument()
    expect(screen.getByText('1 item')).toBeInTheDocument()
  })

  it('shows the price of an item without sizes (AC 4)', async () => {
    mockFetch({ status: 200, body: page })
    render(<RestaurantPage id="r1" />)
    const row = (await screen.findByText('Chicken tikka masala')).closest('li')!
    expect(within(row).getByText('£12.50')).toBeInTheDocument()
  })

  it('shows each size with its own price and a "from" price (AC 5, 11)', async () => {
    mockFetch({ status: 200, body: page })
    render(<RestaurantPage id="r1" />)
    const sizes = within(await screen.findByRole('list', { name: 'Sizes for Lamb biryani' }))
    expect(sizes.getByText('Regular').parentElement).toHaveTextContent('£9.00')
    expect(sizes.getByText('Large').parentElement).toHaveTextContent('£12.00')
    expect(within(screen.getByText('Lamb biryani').closest('li')!).getByText('from £9.00')).toBeInTheDocument()
  })

  it('labels a sold-out item as unavailable (AC 6)', async () => {
    mockFetch({ status: 200, body: page })
    render(<RestaurantPage id="r1" />)
    const row = (await screen.findByText('Goan prawn curry')).closest('li')!
    expect(within(row).getByText('Sold out')).toBeInTheDocument()
    expect(within(row).getByText('Currently unavailable')).toBeInTheDocument()
  })

  it('labels an available item as available (AC 7)', async () => {
    mockFetch({ status: 200, body: page })
    render(<RestaurantPage id="r1" />)
    const row = (await screen.findByText('Onion bhaji')).closest('li')!
    expect(within(row).getByText('Available')).toBeInTheDocument()
    expect(within(row).queryByText('Sold out')).not.toBeInTheDocument()
  })

  it('shows open now with the closing time and the opening hours table (AC 8)', async () => {
    mockFetch({ status: 200, body: page })
    render(<RestaurantPage id="r1" />)
    expect(await screen.findByText('Open now')).toBeInTheDocument()
    expect(screen.getByText('Closes at 22:00 today.')).toBeInTheDocument()
    const table = screen.getByRole('table', { name: /Opening hours/ })
    const friday = within(table).getByRole('row', { name: /Friday/ })
    expect(friday).toHaveAttribute('aria-current', 'date')
    expect(within(friday).getByText('Today')).toBeInTheDocument()
    expect(within(friday).getByText('18:00 to 22:00')).toBeInTheDocument()
    expect(within(within(table).getByRole('row', { name: /Saturday/ })).getByText('12:00 to 14:00, 18:00 to 22:00')).toBeInTheDocument()
    expect(within(within(table).getByRole('row', { name: /Monday/ })).getByText('Closed all day')).toBeInTheDocument()
  })

  it('shows closed now with the next opening, not the temporary closure (AC 8)', async () => {
    mockFetch({ status: 200, body: { ...page, isOpen: false, closesAt: null, nextOpening: { weekday: 6, opens: '17:00' } } })
    render(<RestaurantPage id="r1" />)
    expect(await screen.findByText('Closed now')).toBeInTheDocument()
    expect(screen.getByText(/Opens again at 17:00 on Saturday/)).toBeInTheDocument()
    expect(screen.queryByText('Temporarily closed')).not.toBeInTheDocument()
    expect(screen.queryByText('Open now')).not.toBeInTheDocument()
    expect(screen.getByText('Onion bhaji')).toBeInTheDocument()
  })

  it('says "today" when the next opening is later today', async () => {
    mockFetch({ status: 200, body: { ...page, isOpen: false, closesAt: null, nextOpening: { weekday: 5, opens: '18:00' } } })
    render(<RestaurantPage id="r1" />)
    expect(await screen.findByText(/Opens again at 18:00 today/)).toBeInTheDocument()
  })

  it('shows temporarily closed and keeps the menu readable (AC 9)', async () => {
    mockFetch({ status: 200, body: { ...page, isOpen: false, temporarilyClosed: true, closesAt: null } })
    render(<RestaurantPage id="r1" />)
    expect(await screen.findByText('Temporarily closed')).toBeInTheDocument()
    expect(screen.queryByText('Open now')).not.toBeInTheDocument()
    expect(screen.getByText(/This restaurant is temporarily closed/)).toBeInTheDocument()
    expect(screen.getByText('Onion bhaji')).toBeInTheDocument()
  })

  it('shows a no-menu message with no categories or only empty categories (AC 10)', async () => {
    mockFetch({ status: 200, body: { ...page, categories: [] } })
    const { unmount } = render(<RestaurantPage id="r1" />)
    expect(await screen.findByText('No menu items available')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Saffron & Spice' })).toBeInTheDocument()
    unmount()
    mockFetch({ status: 200, body: { ...page, categories: [{ id: 'c1', name: 'Starters', items: [] }] } })
    render(<RestaurantPage id="r1" />)
    expect(await screen.findByText('No menu items available')).toBeInTheDocument()
  })
})
