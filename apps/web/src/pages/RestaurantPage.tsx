import { useCallback, useEffect, useState } from 'react'
import { ApiError, getRestaurant, type RestaurantPageData } from '../api/listingsApi'
import MenuSection, { ImageIcon } from '../components/MenuSection'

type View =
  | { id: 'loading' }
  | { id: 'ready'; data: RestaurantPageData }
  | { id: 'not-found' }
  | { id: 'failed' }

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function openingTimes(data: RestaurantPageData, weekday: number): string {
  const slots = data.hours.filter((s) => s.weekday === weekday)
  return slots.length ? slots.map((s) => `${s.opens} to ${s.closes}`).join(', ') : 'Closed all day'
}

function StatusBadge({ data }: { data: RestaurantPageData }) {
  if (data.isOpen) return <span className="badge badge-success">Open now</span>
  return <span className="badge badge-danger">{data.temporarilyClosed ? 'Temporarily closed' : 'Closed now'}</span>
}

function StatusLine({ data }: { data: RestaurantPageData }) {
  if (data.isOpen) return <div className="meta"><strong>{`Closes at ${data.closesAt} today.`}</strong></div>
  if (data.temporarilyClosed) return null
  const next = data.nextOpening
  return (
    <div className="meta">
      <strong>Outside opening hours.</strong>
      {next && (
        <span className="text-muted">
          {`Opens again at ${next.opens} ${next.weekday === data.today ? 'today' : `on ${DAYS[next.weekday - 1]}`}.`}
        </span>
      )}
    </div>
  )
}

function Header({ data }: { data: RestaurantPageData }) {
  return (
    <section className="card stack-sm rest-card" aria-labelledby="restaurant-name">
      <div className="rest-banner" role="img" aria-label={`Photo of ${data.name}, placeholder`}>
        <ImageIcon />
        <span>Restaurant photo</span>
      </div>
      <div className="head-row">
        <h1 id="restaurant-name">{data.name}</h1>
        <StatusBadge data={data} />
      </div>
      <div className="tags">
        <span className="badge">{data.cuisine}</span>
        <span className="badge">{data.addressCity}</span>
      </div>
      <p className="text-muted">{data.description}</p>
      <StatusLine data={data} />
      <div className="table-wrap">
        <table className="table">
          <caption className="text-muted" style={{ textAlign: 'left' }}>
            Opening hours, local time
          </caption>
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col">Opening times</th>
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day, index) => {
              const isToday = index + 1 === data.today
              return (
                <tr key={day} aria-current={isToday ? 'date' : undefined}>
                  <th scope="row">
                    {day} {isToday && <span className="badge">Today</span>}
                  </th>
                  <td className={isToday ? 'today' : undefined}>{openingTimes(data, index + 1)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default function RestaurantPage({ id }: { id: string }) {
  const [view, setView] = useState<View>({ id: 'loading' })

  const load = useCallback(async () => {
    setView({ id: 'loading' })
    try {
      setView({ id: 'ready', data: await getRestaurant(id) })
    } catch (err) {
      setView(err instanceof ApiError && err.status === 404 ? { id: 'not-found' } : { id: 'failed' })
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="menu-wrap">
      <p>
        <a href="#">Back to restaurants</a>
      </p>

      {view.id === 'loading' && (
        <div className="stack" role="status" aria-label="Loading the restaurant and menu">
          <div className="card stack-sm">
            <span className="skeleton" style={{ width: '45%', height: 'var(--space-4)' }} />
            <span className="skeleton skeleton-line" style={{ width: '80%' }} />
            <span className="skeleton skeleton-line" style={{ width: '30%' }} />
          </div>
          <div className="card stack-sm">
            <span className="skeleton" style={{ width: '30%', height: 'var(--space-4)' }} />
            <span className="skeleton skeleton-line" style={{ width: '70%' }} />
            <span className="skeleton skeleton-line" style={{ width: '55%' }} />
          </div>
        </div>
      )}

      {view.id === 'not-found' && (
        <div className="empty-state" role="alert">
          <h1>Restaurant not found</h1>
          <p>We couldn't find this restaurant. It may have moved or is not available. Check the link, or look for another restaurant.</p>
        </div>
      )}

      {view.id === 'failed' && (
        <div className="stack-sm">
          <div className="alert alert-danger" role="alert">
            Couldn't load this restaurant. Check your connection, then try again.
          </div>
          <button className="btn btn-secondary" type="button" onClick={() => void load()}>
            Try again
          </button>
        </div>
      )}

      {view.id === 'ready' && (
        <>
          <Header data={view.data} />
          {view.data.temporarilyClosed && (
            <div className="alert alert-warning" role="status">
              <strong>This restaurant is temporarily closed.</strong> It is not taking orders right now. You can still read the menu.
            </div>
          )}
          {view.data.categories.some((c) => c.items.length > 0) ? (
            <div className="stack">
              {view.data.categories
                .filter((c) => c.items.length > 0)
                .map((category) => (
                  <MenuSection key={category.id} category={category} />
                ))}
            </div>
          ) : (
            <div className="empty-state">
              <h2>No menu items available</h2>
              <p>This restaurant has not added any dishes yet. Check back soon.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
