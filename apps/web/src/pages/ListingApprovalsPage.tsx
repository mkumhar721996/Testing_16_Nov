import { useCallback, useEffect, useState } from 'react'
import { ApiError, approveListing, listPending, rejectListing, type Listing } from '../api/listingsApi'
import StatusBadge from '../components/StatusBadge'

type Decision = { listing: Listing; outcome: 'approved' | 'rejected' }

type View =
  | { id: 'loading' }
  | { id: 'queue'; items: Listing[]; decision?: Decision }
  | { id: 'not-admin' }
  | { id: 'failed'; message: string }

export default function ListingApprovalsPage() {
  const [view, setView] = useState<View>({ id: 'loading' })
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setView({ id: 'loading' })
    try {
      setView({ id: 'queue', items: await listPending() })
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setView({ id: 'not-admin' })
      else setView({ id: 'failed', message: err instanceof Error ? err.message : 'Something went wrong.' })
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const decide = async (item: Listing, outcome: Decision['outcome']) => {
    setBusy(true)
    try {
      const decided = outcome === 'approved' ? await approveListing(item.id) : await rejectListing(item.id)
      setView((current) =>
        current.id === 'queue'
          ? { id: 'queue', items: current.items.filter((l) => l.id !== item.id), decision: { listing: decided, outcome } }
          : current,
      )
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setView({ id: 'not-admin' })
      else setView({ id: 'failed', message: err instanceof Error ? err.message : 'Something went wrong.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <h1>Restaurant listings awaiting approval</h1>

      {view.id === 'loading' && (
        <div className="queue stack" role="status" aria-label="Loading listings">
          <div className="card queue-item">
            <span className="skeleton" style={{ width: '60%', height: 'var(--space-5)' }} />
          </div>
          <div className="card queue-item">
            <span className="skeleton" style={{ width: '60%', height: 'var(--space-5)' }} />
          </div>
        </div>
      )}

      {view.id === 'not-admin' && (
        <div className="empty-state panel" role="alert">
          <h2>Admins only</h2>
          <p>You don't have permission to approve or reject restaurant listings. Ask an admin to review this listing.</p>
        </div>
      )}

      {view.id === 'failed' && (
        <div className="alert alert-danger" role="alert">
          Couldn't update the queue: {view.message}. Reload the page to try again.
        </div>
      )}

      {view.id === 'queue' && view.decision && (
        <>
          <div
            className={`alert ${view.decision.outcome === 'approved' ? 'alert-success' : 'alert-danger'}`}
            role="status"
          >
            {view.decision.outcome === 'approved'
              ? `${view.decision.listing.name} is approved and now visible to customers.`
              : `${view.decision.listing.name} is rejected. It stays hidden from customers until the partner edits and resubmits it.`}
          </div>
          <ul className="queue stack">
            <li className="card queue-item">
              <span>{view.decision.listing.name}</span>
              <StatusBadge status={view.decision.outcome} />
            </li>
            {view.items.map((item) => (
              <li className="card queue-item" key={item.id}>
                <span>{item.name}</span>
                <StatusBadge status="pending" />
              </li>
            ))}
          </ul>
          <p>
            <button type="button" className="btn btn-secondary" onClick={() => setView({ id: 'queue', items: view.items })}>
              Back to queue
            </button>
          </p>
        </>
      )}

      {view.id === 'queue' && !view.decision && view.items.length === 0 && (
        <div className="empty-state panel">
          <h2>Nothing to review</h2>
          <p>No restaurant listings are waiting for approval. New and edited listings appear here.</p>
        </div>
      )}

      {view.id === 'queue' && !view.decision && view.items.length > 0 && (
        <>
          <p className="lede">Approved restaurants appear to customers. Rejected ones stay hidden.</p>
          <ul className="queue stack">
            {view.items.map((item) => (
              <li className="card queue-item" key={item.id}>
                <div className="meta">
                  <strong>{item.name}</strong>
                  <span className="text-muted">
                    {item.cuisine}, {item.addressCity}
                  </span>
                  <span>
                    <StatusBadge status="pending" />
                  </span>
                </div>
                <div className="cluster">
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={busy}
                    aria-label={`Approve ${item.name}`}
                    onClick={() => void decide(item, 'approved')}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={busy}
                    aria-label={`Reject ${item.name}`}
                    onClick={() => void decide(item, 'rejected')}
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
