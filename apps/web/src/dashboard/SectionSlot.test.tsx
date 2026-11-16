import { fireEvent, render, screen } from '@testing-library/react'
import { SectionSlot } from './SectionSlot'
import type { SectionState } from './types'

const empty = {
  heading: 'Your watchlist is empty',
  body: 'Add a stock to follow its price and buy from here.',
  actionLabel: 'Add stock',
}

const renderSlot = (state: SectionState<string>, onRetry = vi.fn()) =>
  render(
    <SectionSlot title="Watchlist" state={state} empty={empty} onRetry={onRetry}>
      {(d) => <p>{d}</p>}
    </SectionSlot>,
  )

describe('SectionSlot', () => {
  it('shows error with a single Try again control (AC2, AC8)', () => {
    const onRetry = vi.fn()
    const { container } = renderSlot({ status: 'error' }, onRetry)
    expect(screen.getByText('Watchlist could not be loaded')).toBeInTheDocument()
    expect(container.querySelectorAll('.alert')).toHaveLength(1)
    expect(screen.getAllByRole('button')).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('shows empty state with one action (AC3)', () => {
    renderSlot({ status: 'empty' })
    expect(screen.getByText('Your watchlist is empty')).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })

  it('shows loading skeleton (AC4)', () => {
    const { container } = renderSlot({ status: 'loading' })
    expect(screen.getByRole('status')).toHaveTextContent('Loading watchlist')
    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0)
    expect(container.querySelector('section')).toHaveAttribute('aria-busy', 'true')
  })

  it('shows loaded content', () => {
    renderSlot({ status: 'loaded', data: 'rows' })
    expect(screen.getByText('rows')).toBeInTheDocument()
  })

  it('renders nothing for a follower slot that is not loaded', () => {
    const { container } = render(
      <SectionSlot title="Chart" state={{ status: 'error' }} empty={empty} onRetry={vi.fn()} follower>
        {() => <p>x</p>}
      </SectionSlot>,
    )
    expect(container.querySelector('section')).toBeNull()
  })
})
