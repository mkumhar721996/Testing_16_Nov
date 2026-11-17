import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SlotModal } from './SlotModal'

const existing = [{ opensAt: '11:00', closesAt: '14:30' }]

function setup(trigger: HTMLElement | null = null) {
  const onAdd = vi.fn()
  const onClose = vi.fn()
  render(
    <SlotModal dayName="Monday" city="Bogotá" existing={existing} trigger={trigger} onAdd={onAdd} onClose={onClose} />,
  )
  return { onAdd, onClose }
}

const setTimes = (opens: string, closes: string) => {
  fireEvent.change(screen.getByLabelText('Opens'), { target: { value: opens } })
  fireEvent.change(screen.getByLabelText('Closes'), { target: { value: closes } })
}

describe('SlotModal', () => {
  it('refuses a closing time that is not after opening and flags both inputs', async () => {
    const { onAdd } = setup()
    setTimes('22:00', '18:00')
    fireEvent.click(screen.getByRole('button', { name: 'Add slot' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Closing time must be after opening time. A slot cannot cross midnight.')
    expect(screen.getByLabelText('Opens')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Closes')).toHaveAttribute('aria-invalid', 'true')
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('refuses a missing time', async () => {
    setup()
    setTimes('', '22:00')
    fireEvent.click(screen.getByRole('button', { name: 'Add slot' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Enter both an opening and a closing time.')
  })

  it('refuses an overlapping slot', async () => {
    setup()
    setTimes('14:00', '16:00')
    fireEvent.click(screen.getByRole('button', { name: 'Add slot' }))
    expect(screen.getByRole('alert')).toHaveTextContent('This overlaps the 11:00 – 14:30 slot.')
  })

  it('adds a valid slot', async () => {
    const { onAdd } = setup()
    setTimes('15:00', '17:00')
    fireEvent.click(screen.getByRole('button', { name: 'Add slot' }))
    expect(onAdd).toHaveBeenCalledWith({ opensAt: '15:00', closesAt: '17:00' })
  })

  it('closes on Escape and returns focus to the trigger', async () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    const onClose = vi.fn()
    const { unmount } = render(
      <SlotModal dayName="Monday" city="Bogotá" existing={[]} trigger={trigger} onAdd={vi.fn()} onClose={onClose} />,
    )
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
    unmount()
    expect(trigger).toHaveFocus()
  })

  it('keeps Tab inside the dialog', async () => {
    setup()
    screen.getByRole('button', { name: 'Add slot' }).focus()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab' })
    expect(screen.getByLabelText('Opens')).toHaveFocus()
  })
})
