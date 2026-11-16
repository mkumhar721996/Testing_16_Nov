import { formatChange, periodChange } from './periodChange'

describe('periodChange', () => {
  it('computes percentage change from first to last point', () => {
    expect(periodChange([100, 110])).toBeCloseTo(10)
  })
  it('returns null without a baseline', () => {
    expect(periodChange([100])).toBeNull()
    expect(periodChange([])).toBeNull()
    expect(periodChange([0, 5])).toBeNull()
  })
  it('formats signed percentages and a dash for null', () => {
    expect(formatChange(1.5)).toBe('+1.50%')
    expect(formatChange(-0.4)).toBe('-0.40%')
    expect(formatChange(null)).toBe('—')
  })
})
