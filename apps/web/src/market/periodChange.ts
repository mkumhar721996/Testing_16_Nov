export function periodChange(points: number[]): number | null {
  if (points.length < 2) return null
  const first = points[0]
  if (first === 0) return null
  return ((points[points.length - 1] - first) / first) * 100
}

export function formatChange(change: number | null): string {
  if (change === null) return '—'
  return `${change >= 0 ? '+' : '-'}${Math.abs(change).toFixed(2)}%`
}
