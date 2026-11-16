import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the Dashboard', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument()
    vi.unstubAllGlobals()
  })
})
