import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from './api'
import OpeningHoursPage from './OpeningHoursPage'

vi.mock('./api', async (importOriginal) => ({
  ...(await importOriginal<typeof api>()),
  fetchOpeningHours: vi.fn(),
  saveOpeningHours: vi.fn(),
  setTemporaryClosure: vi.fn(),
}))

const evening = [{ opensAt: '18:00', closesAt: '22:00' }]

function week(overrides: Partial<api.OpeningHours['days']> = {}): api.OpeningHours {
  const days = {} as api.OpeningHours['days']
  for (const day of api.WEEKDAYS) days[day] = { slots: evening }
  days.mon = { slots: [{ opensAt: '11:00', closesAt: '14:30' }, ...evening] }
  return { city: 'Bogotá', timeZone: 'America/Bogota', temporarilyClosed: false, days: { ...days, ...overrides } }
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(api.fetchOpeningHours).mockResolvedValue(week())
})

describe('OpeningHoursPage', () => {
  it('shows the slots of each weekday and the local-time note (AC 1)', async () => {
    render(<OpeningHoursPage />)
    expect(await screen.findByText('11:00 – 14:30')).toBeInTheDocument()
    expect(screen.getAllByText('18:00 – 22:00').length).toBeGreaterThan(1)
    expect(screen.getByText(/Bogotá \(UTC−05:00\)/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove Monday slot 11:00 – 14:30' })).toBeInTheDocument()
  })

  it('shows a loading status while fetching', () => {
    vi.mocked(api.fetchOpeningHours).mockReturnValue(new Promise(() => {}))
    render(<OpeningHoursPage />)
    expect(screen.getByRole('status', { name: 'Loading opening hours' })).toBeInTheDocument()
  })

  it('offers to try again when the fetch fails', async () => {
    vi.mocked(api.fetchOpeningHours).mockRejectedValueOnce(new Error('down'))
    render(<OpeningHoursPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be loaded')
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('11:00 – 14:30')).toBeInTheDocument()
  })

  it('closes and reopens the restaurant (AC 2)', async () => {
    vi.mocked(api.setTemporaryClosure).mockImplementation(async (closed) => ({ ...week(), temporarilyClosed: closed }))
    render(<OpeningHoursPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Temporarily close' }))

    expect(await screen.findByText('Closed')).toHaveClass('badge-danger')
    expect(screen.getByText(/Orders already placed are not cancelled\./)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Remove/ })).not.toBeInTheDocument()
    expect(api.setTemporaryClosure).toHaveBeenCalledWith(true)

    fireEvent.click(screen.getByRole('button', { name: 'Reopen restaurant' }))
    expect(await screen.findByText('Open', { selector: '.badge' })).toHaveClass('badge-success')
    expect(api.setTemporaryClosure).toHaveBeenLastCalledWith(false)
  })

  it('names the weekday with no slots and shows no saved toast (AC 9)', async () => {
    vi.mocked(api.saveOpeningHours).mockRejectedValue(new api.NoSlotsError(['sun']))
    render(<OpeningHoursPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Save hours' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Sunday has no open time slots')
    expect(screen.queryByText('Hours saved.')).not.toBeInTheDocument()
    const row = screen.getByText('Sunday').closest('.day-row')
    expect(row).toHaveClass('has-error')
  })

  it('removes a slot, adds one through the modal and saves (AC 1)', async () => {
    vi.mocked(api.saveOpeningHours).mockResolvedValue(week())
    render(<OpeningHoursPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Remove Monday slot 11:00 – 14:30' }))
    expect(screen.queryByText('11:00 – 14:30')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Add slot on Tuesday' }))
    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add slot' }))
    // 18:00 – 22:00 already exists on Tuesday: refused as an overlap.
    expect(within(dialog).getByRole('alert')).toHaveTextContent('overlaps')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    fireEvent.click(screen.getByRole('button', { name: 'Save hours' }))
    await waitFor(() => expect(screen.getByText('Hours saved.')).toBeInTheDocument())
    const sent = vi.mocked(api.saveOpeningHours).mock.calls[0][0]
    expect(sent.mon.slots).toEqual(evening)
  })
})
