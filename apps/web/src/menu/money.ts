const currency = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'GBP' })

/** Formats integer pence as pounds, e.g. 450 -> "£4.50". */
export function formatMinor(minor: number): string {
  return currency.format(minor / 100)
}

/** Parses typed pounds ("£4.50") to integer pence; null when empty or not a number. */
export function parsePriceToMinor(text: string): number | null {
  const cleaned = text.replace(/[£,\s]/g, '')
  if (cleaned === '') return null
  const value = Number(cleaned)
  return Number.isFinite(value) ? Math.round(value * 100) : null
}
