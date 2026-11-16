import { useCallback, useEffect, useRef, useState } from 'react'
import { useMarketFeed } from './feedContext'
import type { IndexSeries, Period } from './marketFeed'

export type IndicesStatus = 'loading' | 'ready' | 'error'

export function useIndices(period: Period) {
  const feed = useMarketFeed()
  const [state, setState] = useState<{ status: IndicesStatus; data: IndexSeries[] }>({
    status: 'loading',
    data: [],
  })
  const latest = useRef(0)

  const load = useCallback(() => {
    const id = ++latest.current
    feed
      .getIndices(period)
      .then((data) => {
        if (id !== latest.current) return
        setState(data.length > 0 ? { status: 'ready', data } : { status: 'error', data: [] })
      })
      .catch(() => {
        if (id === latest.current) setState({ status: 'error', data: [] })
      })
  }, [feed, period])

  useEffect(() => {
    load()
    return () => {
      latest.current++
    }
  }, [load])

  // Reload keeps showing current data (no flash to loading) unless it is in error.
  const reload = useCallback(() => {
    setState((s) => (s.status === 'error' ? { status: 'loading', data: [] } : s))
    load()
  }, [load])

  return { ...state, reload }
}
