import { useCallback, useEffect, useState } from 'react'
import {
  ApiError,
  createListing,
  getMyListing,
  updateMyListing,
  type Listing,
  type ListingInput,
  type ListingStatus,
} from '../api/listingsApi'
import ListingForm from '../components/ListingForm'
import StatusBadge from '../components/StatusBadge'

type View =
  | { id: 'loading' }
  | { id: 'create'; serverError?: string; formKey: number }
  | { id: 'not-partner' }
  | { id: 'exists' }
  | { id: 'listing'; listing: Listing }
  | { id: 'editing'; listing: Listing; serverError?: string }
  | { id: 'failed'; message: string }

const STATUS_BANNER: Record<ListingStatus, { className: string; text: string }> = {
  pending: {
    className: 'alert alert-warning panel',
    text: "Status: pending approval. Customers can't see this restaurant until an admin approves it.",
  },
  approved: { className: 'alert alert-success panel', text: 'Status: approved. Customers can see this restaurant.' },
  rejected: {
    className: 'alert alert-danger panel',
    text: "Status: rejected. The admin didn't approve this listing, so customers can't see it. Edit the details and resubmit.",
  },
}

const VISIBILITY: Record<ListingStatus, { className: string; label: string }> = {
  pending: { className: 'badge badge-warning', label: 'Hidden until approved' },
  approved: { className: 'badge badge-success', label: 'Visible' },
  rejected: { className: 'badge badge-danger', label: 'Hidden' },
}

export default function RestaurantListingPage() {
  const [view, setView] = useState<View>({ id: 'loading' })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const load = useCallback(async () => {
    setView({ id: 'loading' })
    try {
      setView({ id: 'listing', listing: await getMyListing() })
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) setView({ id: 'create', formKey: 0 })
      else if (err instanceof ApiError && err.status === 403) setView({ id: 'not-partner' })
      else setView({ id: 'failed', message: err instanceof Error ? err.message : 'Something went wrong.' })
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  const create = async (input: ListingInput) => {
    setSaving(true)
    try {
      setView({ id: 'listing', listing: await createListing(input) })
      setToast('Listing submitted for approval')
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setView({ id: 'exists' })
      else if (err instanceof ApiError && err.status === 403) setView({ id: 'not-partner' })
      else setView({ id: 'create', formKey: Date.now(), serverError: err instanceof Error ? err.message : undefined })
    } finally {
      setSaving(false)
    }
  }

  const save = async (listing: Listing, input: ListingInput) => {
    setSaving(true)
    try {
      setView({ id: 'listing', listing: await updateMyListing(input) })
      setToast('Listing submitted for approval')
    } catch (err) {
      setView({ id: 'editing', listing, serverError: err instanceof Error ? err.message : undefined })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1>My restaurant listing</h1>

      {view.id === 'loading' && (
        <div className="card stack stack-sm panel" role="status" aria-label="Loading your listing">
          <span className="skeleton" style={{ width: '50%', height: 'var(--space-4)' }} />
          <span className="skeleton skeleton-line" style={{ width: '30%' }} />
          <span className="skeleton skeleton-line" style={{ width: '70%' }} />
          <span className="skeleton skeleton-line" />
        </div>
      )}

      {view.id === 'create' && (
        <>
          <p className="lede">Create your restaurant. An admin reviews it before customers can see it.</p>
          <ListingForm
            key={view.formKey}
            submitLabel="Submit for approval"
            submitting={saving}
            serverError={view.serverError}
            onSubmit={(input) => void create(input)}
            onCancel={() => setView({ id: 'create', formKey: Date.now() })}
          />
        </>
      )}

      {view.id === 'not-partner' && (
        <div className="empty-state panel" role="alert">
          <h2>You can't create a listing</h2>
          <p>Only signed-in restaurant partners can create a listing. Sign in with your partner account to continue.</p>
        </div>
      )}

      {view.id === 'exists' && (
        <div className="empty-state panel" role="alert">
          <h2>You already have a listing</h2>
          <p>Each partner account can have one restaurant listing. Edit your existing listing instead.</p>
          <button type="button" className="btn btn-secondary" onClick={() => void load()}>
            View my listing
          </button>
        </div>
      )}

      {view.id === 'failed' && (
        <div className="alert alert-danger panel" role="alert">
          Couldn't load your listing: {view.message}. Reload the page to try again.
        </div>
      )}

      {view.id === 'listing' && (
        <>
          <div className={STATUS_BANNER[view.listing.status].className} role="status">
            {STATUS_BANNER[view.listing.status].text}
          </div>
          <div className="card stack panel">
            <div className="head-row">
              <h2>{view.listing.name}</h2>
              <StatusBadge status={view.listing.status} />
            </div>
            <dl className="facts">
              <dt>Cuisine</dt>
              <dd>{view.listing.cuisine}</dd>
              <dt>Address / city</dt>
              <dd>{view.listing.addressCity}</dd>
              <dt>Description</dt>
              <dd>{view.listing.description}</dd>
              <dt>Shown to customers</dt>
              <dd>
                <span className={VISIBILITY[view.listing.status].className}>{VISIBILITY[view.listing.status].label}</span>
              </dd>
            </dl>
            <div className="actions">
              <button
                type="button"
                className={`btn ${view.listing.status === 'rejected' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setView({ id: 'editing', listing: view.listing })}
              >
                {view.listing.status === 'rejected' ? 'Edit and resubmit' : 'Edit listing'}
              </button>
            </div>
          </div>
        </>
      )}

      {view.id === 'editing' && (
        <ListingForm
          title="Edit listing"
          initial={{
            name: view.listing.name,
            cuisine: view.listing.cuisine,
            addressCity: view.listing.addressCity,
            description: view.listing.description,
          }}
          submitLabel="Save and submit for approval"
          hint="Saving sends the listing back for approval. Customers won't see the changes, or the restaurant, until an admin approves it."
          submitting={saving}
          serverError={view.serverError}
          onSubmit={(input) => void save(view.listing, input)}
          onCancel={() => setView({ id: 'listing', listing: view.listing })}
        />
      )}

      {toast && (
        <div className="toast is-open" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}
