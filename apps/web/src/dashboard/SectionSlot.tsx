import { useEffect, useRef, type ReactNode } from 'react'
import type { SectionState } from './types'

export interface EmptyCopy {
  heading: string
  body: string
  actionLabel: string
  onAction?: () => void
}

interface Props<T> {
  title: string
  state: SectionState<T>
  empty: EmptyCopy
  onRetry: () => void
  children: (data: T) => ReactNode
  slot?: string
  // The index and SIP sections span two slots; only the leader shows loading, empty and error.
  follower?: boolean
  // 'state' leaders are bare when loaded (index cards); others are always cards.
  card?: 'always' | 'state'
  skeleton?: 'grid' | 'lines'
}

export function SectionSlot<T>({
  title,
  state,
  empty,
  onRetry,
  children,
  slot,
  follower = false,
  card = 'always',
  skeleton = 'lines',
}: Props<T>) {
  const section = useRef<HTMLElement>(null)
  const retryButton = useRef<HTMLButtonElement>(null)
  const retried = useRef(false)

  useEffect(() => {
    if (!retried.current || state.status === 'loading') return
    retried.current = false
    if (state.status === 'error') retryButton.current?.focus()
    else section.current?.focus()
  }, [state.status])

  if (follower && state.status !== 'loaded') return null

  const loaded = state.status === 'loaded'
  const className = `dash-slot${card === 'always' || !loaded ? ' card' : ''}`

  return (
    <section
      ref={section}
      className={className}
      data-slot={slot}
      aria-label={follower ? undefined : title}
      aria-busy={state.status === 'loading' ? true : undefined}
      aria-live="polite"
      tabIndex={-1}
    >
      {state.status === 'loading' && (
        <>
          <h2 className="dash-title">{title}</h2>
          <div className="stack" role="status">
            <p className="dash-note">Loading {title.toLowerCase()}…</p>
            {skeleton === 'grid' ? (
              <div className="sk-grid">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="skeleton sk-block" />
                ))}
              </div>
            ) : (
              <>
                <div className="skeleton sk-lg" />
                <div className="skeleton sk-md" />
                <div className="skeleton sk-md" />
                <div className="skeleton sk-md sk-short" />
              </>
            )}
          </div>
        </>
      )}
      {state.status === 'empty' && (
        <>
          <h2 className="dash-title">{title}</h2>
          <div className="empty-state">
            <h3 className="dash-title">{empty.heading}</h3>
            <p className="text-muted">{empty.body}</p>
            <button type="button" className="btn btn-secondary" onClick={empty.onAction}>
              {empty.actionLabel}
            </button>
          </div>
        </>
      )}
      {state.status === 'error' && (
        <>
          <h2 className="dash-title">{title}</h2>
          <div className="state-box">
            <div className="alert alert-danger">
              <p className="text-bold">{title} could not be loaded</p>
              <p>Check your connection and try again.</p>
            </div>
            <button
              ref={retryButton}
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                retried.current = true
                onRetry()
              }}
            >
              Try again
            </button>
          </div>
        </>
      )}
      {state.status === 'loaded' && children(state.data)}
    </section>
  )
}
