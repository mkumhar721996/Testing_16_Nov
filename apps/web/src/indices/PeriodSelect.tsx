import type { Period } from '../market/marketFeed'

const OPTIONS: { id: Period; label: string }[] = [
  { id: '1D', label: '1 day' },
  { id: '1W', label: '1 week' },
  { id: '1M', label: '1 month' },
  { id: '1Y', label: '1 year' },
]

export function PeriodSelect({
  value,
  onChange,
}: {
  value: Period
  onChange: (period: Period) => void
}) {
  return (
    <label className="flex items-center gap-[var(--space-2)] text-[length:var(--font-size-sm)] text-[color:var(--color-fg-muted)]">
      Period
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Period)}
        className="min-h-[var(--tap-target)] rounded-[var(--radius-md)] border-[length:var(--border-width)] border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-[var(--space-2)] text-[color:var(--color-fg)] focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-[color:var(--color-focus)]"
      >
        {OPTIONS.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
