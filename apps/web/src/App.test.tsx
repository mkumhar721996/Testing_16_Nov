import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import App from './App'

vi.mock('./api/availability', async (orig) => ({
  ...(await orig<typeof import('./api/availability')>()),
  fetchPartnerMenu: vi.fn().mockResolvedValue([]),
}))

describe('App', () => {
  it('renders the availability heading', async () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Availability' })).toBeInTheDocument()
    expect(await screen.findByText('No items to mark yet')).toBeInTheDocument()
  })
})
