import { fireEvent, render, screen, within } from '@testing-library/react'
import App from './App'

vi.mock('./menu/menuApi', () => ({
  getPartnerMenu: vi.fn().mockResolvedValue({ categories: [] }),
  getCustomerMenu: vi.fn().mockResolvedValue({ categories: [] }),
}))

describe('App', () => {
  it('shows the four sections in order with the current one marked', async () => {
    render(<App />)
    // closed on phones (the menu button opens it), always visible from 768px by CSS
    const nav = screen.getByLabelText('Main', { selector: 'nav' })
    const links = within(nav).getAllByRole('link', { hidden: true })
    expect(links.map((link) => link.textContent)).toEqual(['Dashboard', 'Projects', 'Activity', 'Settings'])
    expect(links.filter((link) => link.getAttribute('aria-current') === 'page')).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Account' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Menu' })).toBeInTheDocument()
  })

  it('switches to the customer preview and back', async () => {
    render(<App />)
    fireEvent.click(await screen.findByRole('link', { name: 'See what customers see' }))
    expect(await screen.findByRole('heading', { name: 'Customer menu' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('link', { name: 'Back to menu' }))
    expect(await screen.findByRole('heading', { name: 'Menu' })).toBeInTheDocument()
  })
})
