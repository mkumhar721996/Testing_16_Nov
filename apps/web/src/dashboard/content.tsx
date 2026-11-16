// Minimal presentational renderers so the Dashboard works end to end. The content
// of each section belongs to its own epic (Market data and indices, SIP management,
// Watchlist and stock buying, IPO listings).
import type { Period } from './types'

export interface IndexQuote {
  name: string
  value: string
  change: string
  series?: number[]
}
export interface SipItem {
  fund: string
  plan: string
  return: string
}
export interface SipData {
  summary: { invested: string; currentValue: string; returnPct: string }
  items: SipItem[]
}
export interface WatchlistItem {
  symbol: string
  name: string
  price: string
  change: string
}
export interface IpoItem {
  company: string
  dates: string
  band: string
  size: string
  lot: string
  status: string
}

const tone = (change: string) => (change.trim().startsWith('-') ? 'badge-danger' : 'badge-success')
const arrow = (change: string) => (change.trim().startsWith('-') ? '▼' : '▲')

export function IndexCards({ indices }: { indices: IndexQuote[] }) {
  return (
    <>
      <h2 className="sr-only">Market indices</h2>
      <div className="index-grid">
        {indices.map((i) => (
          <div key={i.name} className="card">
            <p className="text-muted">{i.name}</p>
            <div className="stat">{i.value}</div>
            <span className={`badge ${tone(i.change)}`}>
              {arrow(i.change)} {i.change}
            </span>
          </div>
        ))}
      </div>
    </>
  )
}

export function IndexChart({ indices, period }: { indices: IndexQuote[]; period: Period }) {
  const lead = indices[0]
  const series = lead.series ?? []
  const max = Math.max(...series)
  const min = Math.min(...series)
  const points = series
    .map((v, n) => {
      const x = series.length > 1 ? (n / (series.length - 1)) * 100 : 0
      const y = max === min ? 50 : 100 - ((v - min) / (max - min)) * 100
      return `${x},${y}`
    })
    .join(' ')
  return (
    <>
      <div className="dash-head">
        <h2 className="dash-title">{lead.name} trend</h2>
        <span className="dash-note">Last {period}</span>
      </div>
      {series.length > 1 && (
        <svg
          className="chart-svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          role="img"
          aria-label={`Line chart of the ${lead.name} value over the last ${period}`}
        >
          <polyline className="series" points={points} />
        </svg>
      )}
    </>
  )
}

export function SipSummary({ data }: { data: SipData }) {
  return (
    <div className="summary">
      <h2 className="dash-title">SIP summary</h2>
      <div className="stat">{data.summary.invested}</div>
      <p className="text-muted">
        Invested across {data.items.length} active {data.items.length === 1 ? 'SIP' : 'SIPs'}
      </p>
      <p>
        Current value {data.summary.currentValue}{' '}
        <span className={`badge ${tone(data.summary.returnPct)}`}>
          {arrow(data.summary.returnPct)} {data.summary.returnPct}
        </span>
      </p>
    </div>
  )
}

export function SipList({ items }: { items: SipItem[] }) {
  return (
    <>
      <h2 className="dash-title">Active SIPs</h2>
      <ul className="stack-list">
        {items.map((s) => (
          <li key={s.fund}>
            <div>
              <p className="text-bold">{s.fund}</p>
              <p className="text-muted">{s.plan}</p>
            </div>
            <span className={`badge ${tone(s.return)}`}>{s.return}</span>
          </li>
        ))}
      </ul>
    </>
  )
}

export function WatchlistTable({ items }: { items: WatchlistItem[] }) {
  return (
    <>
      <div className="dash-head">
        <h2 className="dash-title">Watchlist</h2>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Symbol</th>
              <th scope="col">Name</th>
              <th scope="col">Price (₹)</th>
              <th scope="col">Change</th>
            </tr>
          </thead>
          <tbody>
            {items.map((w) => (
              <tr key={w.symbol}>
                <td className="text-bold">{w.symbol}</td>
                <td>{w.name}</td>
                <td>
                  {arrow(w.change)} {w.price}
                </td>
                <td>
                  <span className={`badge ${tone(w.change)}`}>{w.change}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export function IpoTable({ items }: { items: IpoItem[] }) {
  return (
    <>
      <div className="dash-head">
        <h2 className="dash-title">IPO details</h2>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Company</th>
              <th scope="col">Issue dates</th>
              <th scope="col">Price band (₹)</th>
              <th scope="col">Issue size</th>
              <th scope="col">Lot size</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.company}>
                <td className="text-bold">{i.company}</td>
                <td>{i.dates}</td>
                <td>{i.band}</td>
                <td>{i.size}</td>
                <td>{i.lot}</td>
                <td>
                  <span className={`badge ${i.status === 'Open' ? 'badge-success' : ''}`}>
                    {i.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
