import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import RestaurantListingPage from './RestaurantListingPage'

const listing = {
  id: 'l1',
  name: 'Saffron & Spice',
  cuisine: 'Indian',
  addressCity: '12 High Street, Leeds',
  description: 'Family-run Indian kitchen serving home-style curries.',
  status: 'pending',
}

type Reply = { status: number; body?: unknown }
const json = ({ status, body }: Reply) =>
  Promise.resolve(new Response(JSON.stringify(body ?? {}), { status, headers: { 'content-type': 'application/json' } }))

function mockFetch(...replies: Reply[]) {
  const fn = vi.fn((..._args: [string, RequestInit?]) => json(replies.shift() ?? { status: 500 }))
  vi.stubGlobal('fetch', fn)
  return fn
}

afterEach(() => vi.unstubAllGlobals())

describe('RestaurantListingPage', () => {
  it('shows the entered fields and pending status (AC 2)', async () => {
    mockFetch({ status: 200, body: listing })
    render(<RestaurantListingPage />)
    expect(await screen.findByText('Saffron & Spice')).toBeInTheDocument()
    expect(screen.getByText('Indian')).toBeInTheDocument()
    expect(screen.getByText('12 High Street, Leeds')).toBeInTheDocument()
    expect(screen.getByText(listing.description)).toBeInTheDocument()
    expect(screen.getByText('Pending approval')).toBeInTheDocument()
    expect(screen.getByText(/Status: pending approval\./)).toBeInTheDocument()
  })

  it('shows rejected status and opens the form from "Edit and resubmit" (AC 13, 14)', async () => {
    mockFetch({ status: 200, body: { ...listing, status: 'rejected' } })
    render(<RestaurantListingPage />)
    expect(await screen.findByText(/Status: rejected\./)).toBeInTheDocument()
    expect(screen.getByText('Rejected')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Edit and resubmit' }))
    expect(screen.getByLabelText('Restaurant name')).toHaveValue('Saffron & Spice')
  })

  it('creates a listing from the form (AC 1)', async () => {
    const fetchMock = mockFetch({ status: 404 }, { status: 201, body: listing })
    render(<RestaurantListingPage />)
    fireEvent.change(await screen.findByLabelText('Restaurant name'), { target: { value: 'Saffron & Spice' } })
    fireEvent.change(screen.getByLabelText('Cuisine'), { target: { value: 'Indian' } })
    fireEvent.change(screen.getByLabelText('Address / city'), { target: { value: '12 High Street, Leeds' } })
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Family-run' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit for approval' }))
    expect(await screen.findByText('Listing submitted for approval')).toBeInTheDocument()
    const [url, init] = fetchMock.mock.calls[1]
    expect(url).toBe('/restaurant-listings')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(String(init?.body))).toEqual({
      name: 'Saffron & Spice',
      cuisine: 'Indian',
      addressCity: '12 High Street, Leeds',
      description: 'Family-run',
    })
  })

  it('refuses an empty create without posting and keeps typed values (AC 15)', async () => {
    const fetchMock = mockFetch({ status: 404 })
    render(<RestaurantListingPage />)
    fireEvent.change(await screen.findByLabelText('Address / city'), { target: { value: 'Leeds' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit for approval' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Fill in every field')
    const name = screen.getByLabelText('Restaurant name')
    expect(name).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText("Name is required. Enter your restaurant's name.")).toBeInTheDocument()
    expect(screen.getByLabelText('Address / city')).toHaveValue('Leeds')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('shows the not-partner state on 403 (AC 6)', async () => {
    mockFetch({ status: 403 })
    render(<RestaurantListingPage />)
    expect(await screen.findByRole('heading', { name: "You can't create a listing" })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('shows the exists state on a 409 create (AC 12)', async () => {
    mockFetch({ status: 404 }, { status: 409 }, { status: 200, body: listing })
    render(<RestaurantListingPage />)
    fireEvent.change(await screen.findByLabelText('Restaurant name'), { target: { value: 'A' } })
    fireEvent.change(screen.getByLabelText('Cuisine'), { target: { value: 'Thai' } })
    fireEvent.change(screen.getByLabelText('Address / city'), { target: { value: 'B' } })
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'C' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit for approval' }))
    expect(await screen.findByRole('heading', { name: 'You already have a listing' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'View my listing' }))
    expect(await screen.findByText('Saffron & Spice')).toBeInTheDocument()
  })

  it('saves an edited name and returns to pending approval (AC 9, 11)', async () => {
    const fetchMock = mockFetch(
      { status: 200, body: { ...listing, status: 'approved' } },
      { status: 200, body: { ...listing, name: 'Saffron & Spice Kitchen', status: 'pending' } },
    )
    render(<RestaurantListingPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Edit listing' }))
    const name = screen.getByLabelText('Restaurant name')
        fireEvent.change(name, { target: { value: 'Saffron & Spice Kitchen' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save and submit for approval' }))
    expect(await screen.findByRole('heading', { name: 'Saffron & Spice Kitchen' })).toBeInTheDocument()
    expect(screen.getByText('Pending approval')).toBeInTheDocument()
    expect(screen.getByText(/Status: pending approval\./)).toBeInTheDocument()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    const [url, init] = fetchMock.mock.calls[1]
    expect(url).toBe('/restaurant-listings/mine')
    expect(init?.method).toBe('PUT')
    expect(JSON.parse(String(init?.body)).name).toBe('Saffron & Spice Kitchen')
  })
})
