import { fireEvent, render, screen } from '@testing-library/react'
import { TopBar } from './TopBar'

const user = { name: 'Anika Kapoor', email: 'anika.kapoor@example.com' }

describe('TopBar (AC14, AC18)', () => {
  it('shows the product name and the user menu trigger', () => {
    render(<TopBar productName="Market Dashboard" user={user} />)
    expect(screen.getByText('Market Dashboard')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'User menu for Anika Kapoor' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('opens the menu, then closes it on Escape', () => {
    render(<TopBar productName="Market Dashboard" user={user} />)
    const trigger = screen.getByRole('button', { name: 'User menu for Anika Kapoor' })
    fireEvent.click(trigger)
    expect(screen.getByText('Signed in as anika.kapoor@example.com')).toBeVisible()
    expect(screen.getByRole('menuitem', { name: 'Sign out' })).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('menuitem', { name: 'Sign out' })).not.toBeInTheDocument()
  })

  it('closes on outside click', () => {
    render(<TopBar productName="Market Dashboard" user={user} />)
    fireEvent.click(screen.getByRole('button', { name: 'User menu for Anika Kapoor' }))
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('menuitem', { name: 'Sign out' })).not.toBeInTheDocument()
  })
})
