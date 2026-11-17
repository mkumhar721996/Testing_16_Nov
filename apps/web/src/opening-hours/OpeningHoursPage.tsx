import { useState } from 'react'
import { WEEKDAYS, WEEKDAY_NAMES, type Weekday } from './api'
import { DayRow } from './DayRow'
import { SlotModal } from './SlotModal'
import { useOpeningHours } from './useOpeningHours'
import './opening-hours.css'

/** "UTC−05:00" for the restaurant's zone right now, so daylight saving is reflected. */
function utcOffsetLabel(timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' }).formatToParts(new Date())
  const raw = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT'
  const offset = raw === 'GMT' ? '+00:00' : raw.replace('GMT', '')
  return `UTC${offset.replace('-', '−')}`
}

function Skeleton() {
  return (
    <div className="stack" role="status" aria-label="Loading opening hours">
      <div className="card stack-sm">
        <span className="skeleton skeleton-title" />
        <span className="skeleton skeleton-line w-60" />
      </div>
      <div className="card stack-sm">
        <span className="skeleton skeleton-line w-70" />
        <span className="skeleton skeleton-line w-55" />
        <span className="skeleton skeleton-line w-65" />
        <span className="skeleton skeleton-line w-50" />
      </div>
    </div>
  )
}

export default function OpeningHoursPage() {
  const state = useOpeningHours()
  const { hours, loadState, errorDays, busy, message, actionError } = state
  const [adding, setAdding] = useState<{ weekday: Weekday; trigger: HTMLElement } | null>(null)

  const body = (() => {
    if (loadState === 'loading') return <Skeleton />
    if (loadState === 'failed' || !hours) {
      return (
        <div className="alert alert-danger" role="alert">
          <p>Opening hours could not be loaded. Check your connection and try again.</p>
          <button type="button" className="btn btn-secondary" onClick={state.load}>
            Try again
          </button>
        </div>
      )
    }

    const closed = hours.temporarilyClosed
    const missing = errorDays.map((d) => WEEKDAY_NAMES[d])
    return (
      <>
        {closed && (
          <div className="alert alert-warning" role="status">
            Restaurant is temporarily closed. Customers cannot place new orders. Orders already placed are not cancelled.
          </div>
        )}
        {errorDays.length > 0 && (
          <div className="alert alert-danger" role="alert">
            <strong>Your hours were not saved.</strong> {missing.join(', ')} {missing.length > 1 ? 'have' : 'has'} no open
            time slots. Add at least one slot to each weekday.
          </div>
        )}
        {actionError && (
          <div className="alert alert-danger" role="alert">
            {actionError}
          </div>
        )}
        <div className="card head-row">
          <div className="status-text">
            <span className="status-line">
              <strong>Restaurant status: {closed ? 'Temporarily closed' : 'Open'}</strong>
              <span className={closed ? 'badge badge-danger' : 'badge badge-success'}>{closed ? 'Closed' : 'Open'}</span>
            </span>
            <span className="text-muted">
              {closed
                ? 'Your opening hours stay saved and apply again when you reopen.'
                : 'Close the restaurant to stop customers ordering right away.'}
            </span>
          </div>
          <button
            type="button"
            className={closed ? 'btn btn-primary' : 'btn btn-secondary'}
            disabled={busy}
            onClick={() => state.setClosed(!closed)}
          >
            {closed ? 'Reopen restaurant' : 'Temporarily close'}
          </button>
        </div>
        <section className="card" aria-label={closed ? 'Saved opening hours' : 'Weekly opening hours'}>
          {WEEKDAYS.map((weekday) => (
            <DayRow
              key={weekday}
              weekday={weekday}
              slots={hours.days[weekday].slots}
              readOnly={closed}
              hasError={errorDays.includes(weekday)}
              onAdd={(day, trigger) => setAdding({ weekday: day, trigger })}
              onRemove={state.removeSlot}
            />
          ))}
        </section>
        {!closed && (
          <div className="actions">
            <button type="button" className="btn btn-primary" disabled={busy} onClick={state.save}>
              Save hours
            </button>
          </div>
        )}
        {adding && (
          <SlotModal
            dayName={WEEKDAY_NAMES[adding.weekday]}
            city={hours.city}
            existing={hours.days[adding.weekday].slots}
            trigger={adding.trigger}
            onAdd={(slot) => {
              state.addSlot(adding.weekday, slot)
              setAdding(null)
            }}
            onClose={() => setAdding(null)}
          />
        )}
      </>
    )
  })()

  return (
    <div className="menu-wrap stack page-body">
      <div className="head-row">
        <div>
          <h1>Opening hours</h1>
          {hours && (
            <p className="lede">
              Times are in the local time of your restaurant's city, {hours.city} ({utcOffsetLabel(hours.timeZone)}).
            </p>
          )}
        </div>
      </div>
      {body}
      {message && (
        <div className="toast is-open" role="status">
          {message}
        </div>
      )}
    </div>
  )
}
