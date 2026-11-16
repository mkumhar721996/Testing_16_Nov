import type { IndexSeries } from '../market/marketFeed'

const W = 600
const H = 200

export function IndexChart({ index }: { index: IndexSeries }) {
  const { points } = index
  const min = Math.min(...points)
  const span = Math.max(...points) - min || 1
  const step = points.length > 1 ? W / (points.length - 1) : 0
  const coords = points
    .map((p, i) => `${(i * step).toFixed(1)},${(H - ((p - min) / span) * H).toFixed(1)}`)
    .join(' ')
  return (
    <svg
      role="img"
      aria-label={`${index.name} chart`}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="h-48 w-full rounded-[var(--radius-lg)] border-[length:var(--border-width)] border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-[var(--space-2)] text-[color:var(--color-primary)]"
    >
      <polyline
        points={coords}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
