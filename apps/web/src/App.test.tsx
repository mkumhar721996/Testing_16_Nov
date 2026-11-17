import { render, screen, within } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import App from './App'

afterEach(() => vi.unstubAllGlobals())

describe('App shell', () => {
  it('lists the main sections in order with Dashboard current', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
    render(<App />)
    expect(screen.getByRole('link', { name: 'Dashboard', hidden: true })).toHaveAttribute('aria-current', 'page')
    const nav = screen.getByLabelText('Main')
    const labels = within(nav)
      .getAllByRole('link', { hidden: true })
      .map((a) => a.textContent)
    expect(labels).toEqual(['Dashboard', 'Projects', 'Activity', 'Settings'])
  })
})
