import { useState } from 'react'
import type { IndexId, Period } from '../market/marketFeed'
import { useIndices } from '../market/useIndices'
import { IndexCard } from './IndexCard'
import { IndexChart } from './IndexChart'
import { PeriodSelect } from './PeriodSelect'
import { SectionError } from './SectionError'

export function IndicesSection() {
  const [period, setPeriod] = useState<Period>('1D')
  const [selectedId, setSelectedId] = useState<IndexId>('nifty50')
  const { status, data, reload } = useIndices(period)

  const selected = data.find((i) => i.id === selectedId) ?? data[0]

  const onSelect = (id: IndexId) => {
    setSelectedId(id)
    reload()
  }

  return (
    <section
      aria-labelledby="indices-heading"
      className="flex flex-col gap-[var(--space-3)] text-[color:var(--color-fg)]"
    >
      <div className="flex items-center justify-between gap-[var(--space-3)]">
        <h2
          id="indices-heading"
          className="text-[length:var(--font-size-lg)] font-[var(--font-weight-medium)]"
        >
          Indices
        </h2>
        <PeriodSelect value={period} onChange={setPeriod} />
      </div>
      {status === 'error' ? (
        <SectionError onRetry={reload} />
      ) : status === 'loading' ? (
        <div aria-busy="true" className="flex flex-col gap-[var(--space-3)]">
          <div className="h-24 rounded-[var(--radius-lg)] bg-[color:var(--color-bg-subtle)]" />
          <div className="h-48 rounded-[var(--radius-lg)] bg-[color:var(--color-bg-subtle)]" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-[var(--space-3)] sm:grid-cols-3">
            {data.map((i) => (
              <IndexCard key={i.id} index={i} selected={i.id === selected.id} onSelect={onSelect} />
            ))}
          </div>
          <IndexChart index={selected} />
        </>
      )}
    </section>
  )
}
