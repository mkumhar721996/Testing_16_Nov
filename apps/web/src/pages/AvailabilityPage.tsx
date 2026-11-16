import { useCallback, useEffect, useState } from 'react'
import { ApiError, fetchPartnerMenu, setItemAvailable, type PartnerItem } from '../api/availability'
import Badge from '../components/Badge'
import Switch from '../components/Switch'
import Toast from '../components/Toast'

const alertDanger =
  'rounded-[var(--radius-md)] border border-l-[length:var(--space-1)] border-[var(--color-danger)] bg-[var(--color-danger-subtle)] px-[var(--space-3)] py-[var(--space-2)] text-[var(--color-fg)]'
const skeletonRow = 'block min-h-[var(--space-3)] rounded-[var(--radius-sm)] bg-[var(--color-bg-subtle)]'

export default function AvailabilityPage() {
  const [items, setItems] = useState<PartnerItem[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [refused, setRefused] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [pending, setPending] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoadFailed(false)
    setItems(null)
    fetchPartnerMenu().then(setItems, () => setLoadFailed(true))
  }, [])

  useEffect(load, [load])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  async function toggle(item: PartnerItem, available: boolean) {
    setPending(item.id)
    setRefused(false)
    try {
      const updated = await setItemAvailable(item.id, available)
      setItems((current) => current?.map((i) => (i.id === item.id ? { ...i, available: updated.available } : i)) ?? null)
      setToast(
        updated.available
          ? `${item.name} is available again. Customers can order it.`
          : `${item.name} marked sold out. Customers can't order it. Other items are unchanged.`,
      )
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setRefused(true)
      else setToast(`Couldn't update ${item.name}. Try again.`)
    } finally {
      setPending(null)
    }
  }

  return (
    <main className="max-w-[var(--content-max-width)] p-[var(--space-4)] text-[var(--color-fg)]">
      <h1 className="mb-[var(--space-3)] text-[length:var(--font-size-xl)] font-[var(--font-weight-bold)]">Availability</h1>
      {refused && (
        <div role="alert" className={`mb-[var(--space-3)] ${alertDanger}`}>
          Change refused. This item belongs to another restaurant. Nothing was changed.
        </div>
      )}
      {loadFailed && (
        <div role="alert" className={`flex items-center justify-between gap-[var(--space-3)] ${alertDanger}`}>
          <span>Couldn't load your items. Check your connection and try again.</span>
          <button type="button" onClick={load} className="underline">
            Try again
          </button>
        </div>
      )}
      {!loadFailed && items === null && (
        <div aria-busy="true" className="flex flex-col gap-[var(--space-2)]">
          <span className={skeletonRow} />
          <span className={skeletonRow} />
        </div>
      )}
      {items?.length === 0 && (
        <div className="flex flex-col items-center gap-[var(--space-2)] rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] px-[var(--space-3)] py-[var(--space-6)] text-center text-[var(--color-fg-muted)]">
          <p>No items to mark yet</p>
        </div>
      )}
      {items && items.length > 0 && (
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-[var(--space-3)]">
          <h2 className="mb-[var(--space-2)] text-[length:var(--font-size-lg)] font-[var(--font-weight-bold)]">Menu items</h2>
          <ul className="flex flex-col gap-[var(--space-3)]">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-[var(--space-3)]">
                <Switch
                  label={`${item.name} available`}
                  checked={item.available}
                  disabled={pending === item.id}
                  onChange={(checked) => void toggle(item, checked)}
                />
                <div className="flex flex-col">
                  <span className="font-[var(--font-weight-medium)]">{item.name}</span>
                  {!item.available && (
                    <span className="text-[length:var(--font-size-sm)] text-[var(--color-fg-muted)]">
                      Stays sold out until you mark it available.
                    </span>
                  )}
                </div>
                <span className="ml-auto">
                  {item.available ? <Badge tone="success">Available</Badge> : <Badge tone="danger">Sold out</Badge>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {toast && <Toast message={toast} />}
    </main>
  )
}
