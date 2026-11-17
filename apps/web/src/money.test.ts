import { priceLabel } from './money'

const item = { id: 'i1', name: 'Lamb biryani', description: '', price: null, available: true, sizes: [] }

describe('priceLabel', () => {
  it('shows the price of an item without sizes (AC 4)', () => {
    expect(priceLabel({ ...item, price: 12.5 })).toBe('£12.50')
  })

  it('shows "from" the lowest size price (AC 11)', () => {
    const sizes = [
      { name: 'Regular', price: 9 },
      { name: 'Large', price: 12 },
    ]
    expect(priceLabel({ ...item, sizes })).toBe('from £9.00')
  })

  it('shows nothing for an item with neither a price nor sizes', () => {
    expect(priceLabel(item)).toBe('')
  })
})
