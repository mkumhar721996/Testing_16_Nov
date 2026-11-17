import type { MenuItem } from './api/listingsApi'

export const formatPrice = (n: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n)

/** "from £9.00" for an item with sizes, its own price otherwise, empty when it has neither. */
export function priceLabel(item: MenuItem): string {
  if (item.sizes.length > 0) return `from ${formatPrice(Math.min(...item.sizes.map((s) => s.price)))}`
  return item.price === null ? '' : formatPrice(item.price)
}
