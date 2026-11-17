import type { ListingStatus } from '../api/listingsApi'

const BADGES: Record<ListingStatus, { className: string; label: string }> = {
  pending: { className: 'badge badge-warning', label: 'Pending approval' },
  approved: { className: 'badge badge-success', label: 'Approved' },
  rejected: { className: 'badge badge-danger', label: 'Rejected' },
}

export default function StatusBadge({ status }: { status: ListingStatus }) {
  const badge = BADGES[status]
  return <span className={badge.className}>{badge.label}</span>
}
