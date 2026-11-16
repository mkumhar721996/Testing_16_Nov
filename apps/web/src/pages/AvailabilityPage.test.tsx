import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { ApiError } from '../api/availability'
import * as api from '../api/availability'
import AvailabilityPage from './AvailabilityPage'

vi.mock('../api/availability', async (orig) => ({
  ...(await orig<typeof import('../api/availability')>()),
  fetchPartnerMenu: vi.fn(),
  setItemAvailable: vi.fn(),
}))

const bhaji = { id: 'i1', name: 'Onion bhaji', available: true }

describe('AvailabilityPage', () => {
  beforeEach(() => {
    vi.mocked(api.fetchPartnerMenu).mockResolvedValue([bhaji])
    vi.mocked(api.setItemAvailable).mockImplementation(async (id, available) => ({ ...bhaji, id, available }))
  })

  it('marks sold out and available again (AC 1)', async () => {
    render(<AvailabilityPage />)
    const sw = await screen.findByRole('switch', { name: 'Onion bhaji available' })
    fireEvent.click(sw)
    expect(await screen.findByText('Sold out')).toBeInTheDocument()
    expect(screen.getByText(/Stays sold out until you mark it available/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('switch', { name: 'Onion bhaji available' }))
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Onion bhaji available' })).toBeChecked())
    expect(screen.getByText('Available')).toBeInTheDocument()
  })

  it('shows the refusal and keeps the prior state on 403 (AC 8)', async () => {
    vi.mocked(api.setItemAvailable).mockRejectedValue(new ApiError(403, 'Forbidden'))
    render(<AvailabilityPage />)
    fireEvent.click(await screen.findByRole('switch', { name: 'Onion bhaji available' }))
    expect(await screen.findByText(/Change refused/)).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Onion bhaji available' })).toBeChecked()
  })

  it('shows an empty state and a load error with retry', async () => {
    vi.mocked(api.fetchPartnerMenu).mockResolvedValueOnce([])
    const { unmount } = render(<AvailabilityPage />)
    expect(await screen.findByText('No items to mark yet')).toBeInTheDocument()
    unmount()
    vi.mocked(api.fetchPartnerMenu).mockRejectedValueOnce(new Error('down'))
    render(<AvailabilityPage />)
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })
})
