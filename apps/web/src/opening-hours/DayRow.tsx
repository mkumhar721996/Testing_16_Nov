import { WEEKDAY_NAMES, type Slot, type Weekday } from './api'

interface DayRowProps {
  weekday: Weekday
  slots: Slot[]
  readOnly: boolean
  hasError: boolean
  onAdd: (weekday: Weekday, trigger: HTMLElement) => void
  onRemove: (weekday: Weekday, index: number) => void
}

export const formatSlot = (slot: Slot) => `${slot.opensAt} – ${slot.closesAt}`

export function DayRow({ weekday, slots, readOnly, hasError, onAdd, onRemove }: DayRowProps) {
  const name = WEEKDAY_NAMES[weekday]
  return (
    <div className={hasError ? 'day-row has-error' : 'day-row'} data-weekday={weekday}>
      <strong className="day-name">{name}</strong>
      <div className="slots">
        {slots.length === 0 ? (
          <span className="text-muted">{hasError ? 'No open slots. Add at least one.' : 'No open slots'}</span>
        ) : (
          slots.map((slot, index) => (
            <span className="slot" key={slot.opensAt}>
              {formatSlot(slot)}
              {!readOnly && (
                <button
                  type="button"
                  className="slot-x"
                  aria-label={`Remove ${name} slot ${formatSlot(slot)}`}
                  onClick={() => onRemove(weekday, index)}
                >
                  <span aria-hidden="true">×</span>
                </button>
              )}
            </span>
          ))
        )}
      </div>
      {!readOnly && (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          aria-label={`Add slot on ${name}`}
          onClick={(event) => onAdd(weekday, event.currentTarget)}
        >
          Add slot
        </button>
      )}
    </div>
  )
}
