import type { SectionState } from './types'

// Only when the watchlist and the SIPs are both loaded and empty; loading and error never count.
export const isWholeDashboardEmpty = (watchlist: SectionState<unknown>, sip: SectionState<unknown>) =>
  watchlist.status === 'empty' && sip.status === 'empty'

interface Props {
  onAddStock?: () => void
  onStartSip?: () => void
}

export function WholeDashboardEmpty({ onAddStock, onStartSip }: Props) {
  return (
    <div className="empty-state">
      <h2>No stocks or SIPs yet</h2>
      <p>Add a stock to your watchlist or start a SIP to see your market dashboard.</p>
      <div className="cluster">
        <button type="button" className="btn btn-primary" onClick={onAddStock}>
          Add stock
        </button>
        <button type="button" className="btn btn-secondary" onClick={onStartSip}>
          Start a SIP
        </button>
      </div>
    </div>
  )
}
