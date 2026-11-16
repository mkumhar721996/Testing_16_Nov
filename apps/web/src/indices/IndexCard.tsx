import { formatChange, periodChange } from '../market/periodChange'
import type { IndexSeries } from '../market/marketFeed'

const valueFormat = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function IndexCard({
  index,
  selected,
  onSelect,
}: {
  index: IndexSeries
  selected: boolean
  onSelect: (id: IndexSeries['id']) => void
}) {
  const change = periodChange(index.points)
  const tone =
    change === null
      ? 'text-[color:var(--color-fg-muted)]'
      : change >= 0
        ? 'text-[color:var(--color-success)]'
        : 'text-[color:var(--color-danger)]'
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(index.id)}
      className={`flex min-h-[var(--tap-target)] flex-col items-start gap-[var(--space-2)] rounded-[var(--radius-lg)] border-[length:var(--border-width)] p-[var(--space-3)] text-left text-[color:var(--color-fg)] focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-[color:var(--color-focus)] ${
        selected
          ? 'border-[color:var(--color-primary)] bg-[color:var(--color-primary-subtle)]'
          : 'border-[color:var(--color-border)] bg-[color:var(--color-bg)]'
      }`}
    >
      <span className="text-[length:var(--font-size-sm)] text-[color:var(--color-fg-muted)]">
        {index.name}
      </span>
      <span className="text-[length:var(--font-size-lg)] font-[var(--font-weight-medium)]">
        {valueFormat.format(index.value)}
      </span>
      <span className={`text-[length:var(--font-size-sm)] ${tone}`}>{formatChange(change)}</span>
    </button>
  )
}
