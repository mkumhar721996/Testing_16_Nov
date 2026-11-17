import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import App from './App'

vi.mock('./opening-hours/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./opening-hours/api')>()),
  fetchOpeningHours: vi.fn(() => new Promise(() => {})),
}))

describe('App', () => {
  it('renders the opening hours page', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Opening hours' })).toBeInTheDocument()
  })
})
