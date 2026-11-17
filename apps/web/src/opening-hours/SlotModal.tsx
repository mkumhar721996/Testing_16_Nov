import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import type { Slot } from './api'
import { formatSlot } from './DayRow'

interface SlotModalProps {
  dayName: string
  city: string
  existing: Slot[]
  /** The element that opened the modal; it gets focus back when the modal closes. */
  trigger: HTMLElement | null
  onAdd: (slot: Slot) => void
  onClose: () => void
}

function slotError(opensAt: string, closesAt: string, existing: Slot[]): string {
  if (!opensAt || !closesAt) return 'Enter both an opening and a closing time.'
  if (closesAt <= opensAt) return 'Closing time must be after opening time. A slot cannot cross midnight.'
  const clash = existing.find((s) => opensAt < s.closesAt && s.opensAt < closesAt)
  return clash ? `This overlaps the ${formatSlot(clash)} slot. Change the times or remove that slot first.` : ''
}

export function SlotModal({ dayName, city, existing, trigger, onAdd, onClose }: SlotModalProps) {
  const [opensAt, setOpensAt] = useState('18:00')
  const [closesAt, setClosesAt] = useState('22:00')
  const [error, setError] = useState('')
  const dialog = useRef<HTMLDivElement>(null)
  const firstInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    firstInput.current?.focus()
    return () => trigger?.focus()
  }, [trigger])

  const focusables = () =>
    Array.from(dialog.current?.querySelectorAll<HTMLElement>('input:not([disabled]), button:not([disabled])') ?? [])

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose()
      return
    }
    if (event.key !== 'Tab') return
    const items = focusables()
    if (items.length === 0) return
    const first = items[0]
    const last = items[items.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const submit = () => {
    const message = slotError(opensAt, closesAt, existing)
    setError(message)
    if (!message) onAdd({ opensAt, closesAt })
  }

  const invalid = error ? { 'aria-invalid': true, 'aria-describedby': 'slot-error' } : {}
  const inputClass = error ? 'input is-invalid' : 'input'

  return (
    <>
      <div className="backdrop is-open" onClick={onClose} />
      <div
        className="modal is-open"
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="slot-heading"
        onKeyDown={onKeyDown}
      >
        <h2 id="slot-heading">Add slot</h2>
        <p className="text-muted">
          {dayName}, {city} local time
        </p>
        <div className="stack">
          <div className="time-pair">
            <div className="field">
              <label htmlFor="slot-open">Opens</label>
              <input
                id="slot-open"
                ref={firstInput}
                className={inputClass}
                type="time"
                value={opensAt}
                onChange={(e) => setOpensAt(e.target.value)}
                {...invalid}
              />
            </div>
            <div className="field">
              <label htmlFor="slot-close">Closes</label>
              <input
                id="slot-close"
                className={inputClass}
                type="time"
                value={closesAt}
                onChange={(e) => setClosesAt(e.target.value)}
                {...invalid}
              />
            </div>
          </div>
          {error && (
            <span className="field-error" id="slot-error" role="alert">
              {error}
            </span>
          )}
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={submit}>
            Add slot
          </button>
        </div>
      </div>
    </>
  )
}
