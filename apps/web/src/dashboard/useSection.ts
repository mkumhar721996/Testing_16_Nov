import { useCallback, useEffect, useRef, useState } from 'react'
import type { Period, SectionSource, SectionState } from './types'

// Each section loads on its own. There is deliberately no failure counter:
// Try again is unlimited and a failed reload returns to plain `error`.
export function useSection<T>(
  source: SectionSource<T>,
  period: Period = '1 month',
  deps: unknown[] = [],
) {
  const [state, setState] = useState<SectionState<T>>({ status: 'loading' })
  const requestId = useRef(0)
  const controller = useRef<AbortController | null>(null)
  const loading = useRef(true)
  const sourceRef = useRef(source)
  sourceRef.current = source

  const run = useCallback(() => {
    controller.current?.abort()
    const ctl = new AbortController()
    controller.current = ctl
    const id = ++requestId.current
    loading.current = true
    setState({ status: 'loading' })
    sourceRef.current
      .load(ctl.signal, { period })
      .then(
        (data): SectionState<T> =>
          sourceRef.current.isEmpty(data) ? { status: 'empty' } : { status: 'loaded', data },
        (): SectionState<T> => ({ status: 'error' }),
      )
      .then((next) => {
        if (id !== requestId.current) return
        loading.current = false
        setState(next)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, ...deps])

  useEffect(() => {
    run()
    return () => {
      requestId.current++
      controller.current?.abort()
    }
  }, [run])

  // A second press while a request is in flight is ignored; reload always restarts.
  const retry = useCallback(() => {
    if (!loading.current) run()
  }, [run])

  return { state, retry, reload: run }
}
