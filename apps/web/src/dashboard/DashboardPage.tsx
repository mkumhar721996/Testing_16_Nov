import { useEffect, useRef, useState } from 'react'
import { IndexCards, IndexChart, IpoTable, SipList, SipSummary, WatchlistTable } from './content'
import { PeriodSelector } from './PeriodSelector'
import { SectionSlot } from './SectionSlot'
import { dashboardSources, type DashboardSources } from './sources'
import { takeStale } from './staleSections'
import { PRODUCT_NAME, TopBar } from './TopBar'
import type { Period, SectionId } from './types'
import { useSection } from './useSection'
import { isWholeDashboardEmpty, WholeDashboardEmpty } from './WholeDashboardEmpty'

interface Props {
  user: { name: string; email: string }
  sources?: DashboardSources
  // What Add stock and Start a SIP open belongs to the sibling epics.
  onAddStock?: () => void
  onStartSip?: () => void
  onViewIpos?: () => void
}

export function DashboardPage({
  user,
  sources = dashboardSources,
  onAddStock,
  onStartSip,
  onViewIpos,
}: Props) {
  const [period, setPeriod] = useState<Period>('1 month')
  const index = useSection(sources.index, period)
  const sip = useSection(sources.sip)
  const watchlist = useSection(sources.watchlist)
  const ipo = useSection(sources.ipo)

  const reloaders = useRef<Record<SectionId, () => void>>({} as Record<SectionId, () => void>)
  reloaders.current = {
    index: index.reload,
    sip: sip.reload,
    watchlist: watchlist.reload,
    ipo: ipo.reload,
  }

  // Returning after a Buy, Apply, Add stock or Start a SIP reloads only the affected sections.
  useEffect(() => {
    const reloadStale = () => takeStale().forEach((id) => reloaders.current[id]())
    const onVisible = () => {
      if (document.visibilityState === 'visible') reloadStale()
    }
    reloadStale()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  const failed = [index, sip, watchlist, ipo].filter((s) => s.state.status === 'error').length

  return (
    <div className="dashboard">
      <TopBar productName={PRODUCT_NAME} user={user} />
      <div className="page-head">
        <h1>Dashboard</h1>
        <div className="page-actions">
          <PeriodSelector value={period} onChange={setPeriod} />
          <button type="button" className="btn btn-primary" onClick={onAddStock}>
            Add stock
          </button>
        </div>
      </div>

      {failed > 0 && (
        <div className="banner-wrap">
          <div className="alert alert-danger" role="alert">
            {failed} of 4 sections could not be loaded. The other sections are up to date.
          </div>
        </div>
      )}

      {isWholeDashboardEmpty(watchlist.state, sip.state) ? (
        <WholeDashboardEmpty onAddStock={onAddStock} onStartSip={onStartSip} />
      ) : (
        <div className="dash">
          <SectionSlot
            title="Market indices"
            slot="index-cards"
            card="state"
            skeleton="grid"
            state={index.state}
            onRetry={index.retry}
            empty={{
              heading: 'No index data for this period',
              body: 'Try a longer period, or check back when the market opens.',
              actionLabel: 'Show 1 year',
              onAction: () => setPeriod('1 year'),
            }}
          >
            {(indices) => <IndexCards indices={indices} />}
          </SectionSlot>

          <div className="dash-row">
            <SectionSlot
              follower
              title="Index trend"
              slot="index-chart"
              state={index.state}
              onRetry={index.retry}
              empty={{ heading: '', body: '', actionLabel: '' }}
            >
              {(indices) => <IndexChart indices={indices} period={period} />}
            </SectionSlot>
            <SectionSlot
              title="SIP summary"
              slot="sip-summary"
              state={sip.state}
              onRetry={sip.retry}
              empty={{
                heading: 'No SIPs yet',
                body: 'Start a SIP to invest a fixed amount each month and track it here.',
                actionLabel: 'Start a SIP',
                onAction: onStartSip,
              }}
            >
              {(data) => <SipSummary data={data} />}
            </SectionSlot>
          </div>

          <div className="dash-row">
            <SectionSlot
              title="Watchlist"
              slot="watchlist"
              state={watchlist.state}
              onRetry={watchlist.retry}
              empty={{
                heading: 'Your watchlist is empty',
                body: 'Add a stock to follow its price and buy from here.',
                actionLabel: 'Add stock',
                onAction: onAddStock,
              }}
            >
              {(items) => <WatchlistTable items={items} />}
            </SectionSlot>
            <SectionSlot
              follower
              title="Active SIPs"
              slot="sip-list"
              state={sip.state}
              onRetry={sip.retry}
              empty={{ heading: '', body: '', actionLabel: '' }}
            >
              {(data) => <SipList items={data.items} />}
            </SectionSlot>
          </div>

          <SectionSlot
            title="IPO details"
            slot="ipo-section"
            state={ipo.state}
            onRetry={ipo.retry}
            empty={{
              heading: 'No IPOs open or upcoming',
              body: 'Upcoming issues appear here once they are announced.',
              actionLabel: 'View all IPOs',
              onAction: onViewIpos,
            }}
          >
            {(items) => <IpoTable items={items} />}
          </SectionSlot>
        </div>
      )}
    </div>
  )
}
