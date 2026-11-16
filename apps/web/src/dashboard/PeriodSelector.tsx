import { PERIODS, type Period } from './types'

interface Props {
  value: Period
  onChange: (period: Period) => void
}

export function PeriodSelector({ value, onChange }: Props) {
  return (
    <label className="period">
      <span className="text-sm text-muted">Period</span>
      <select
        className="input"
        aria-label="Period"
        value={value}
        onChange={(e) => onChange(e.target.value as Period)}
      >
        {PERIODS.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
    </label>
  )
}
