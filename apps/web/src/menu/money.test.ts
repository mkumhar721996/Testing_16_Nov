import { formatMinor, parsePriceToMinor } from './money'

describe('money', () => {
  it('formats pence as pounds', () => {
    expect(formatMinor(450)).toBe('£4.50')
    expect(formatMinor(1400)).toBe('£14.00')
  })

  it('parses typed prices to pence', () => {
    expect(parsePriceToMinor('4.50')).toBe(450)
    expect(parsePriceToMinor(' £1,400.00 ')).toBe(140000)
    expect(parsePriceToMinor('0')).toBe(0)
    expect(parsePriceToMinor('-3')).toBe(-300)
  })

  it('returns null for empty or non-numeric text', () => {
    expect(parsePriceToMinor('')).toBeNull()
    expect(parsePriceToMinor('  ')).toBeNull()
    expect(parsePriceToMinor('abc')).toBeNull()
  })
})
