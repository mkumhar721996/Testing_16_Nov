import { render, screen, within } from '@testing-library/react'
import * as api from './menuApi'
import CustomerMenuPreview from './CustomerMenuPreview'

vi.mock('./menuApi', () => ({ getCustomerMenu: vi.fn() }))

const mocked = vi.mocked(api)

describe('CustomerMenuPreview', () => {
  beforeEach(() => vi.resetAllMocks())

  it('AC8, AC9, AC12: shows saved items with description, price and sizes in saved order', async () => {
    mocked.getCustomerMenu.mockResolvedValue({
      categories: [
        {
          id: 'c2',
          name: 'Mains',
          items: [
            {
              id: 'i2',
              name: 'Biryani',
              description: 'Slow cooked rice',
              priceMinor: 900,
              variants: [{ id: 'v1', name: 'Large', priceMinor: 1400 }],
            },
          ],
        },
        {
          id: 'c1',
          name: 'Starters',
          items: [{ id: 'i1', name: 'Onion bhaji', description: 'Crisp fried onion', priceMinor: 500, variants: [] }],
        },
      ],
    })
    render(<CustomerMenuPreview restaurantId="r1" onBack={() => {}} />)
    expect(await screen.findByText('Onion bhaji')).toBeInTheDocument()
    expect(screen.getByText('Crisp fried onion')).toBeInTheDocument()
    expect(screen.getByText('£5.00')).toBeInTheDocument()
    expect(within(screen.getByRole('list')).getByText('£14.00')).toBeInTheDocument()
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(headings).toEqual(['Mains', 'Starters'])
    expect(mocked.getCustomerMenu).toHaveBeenCalledWith('r1')
  })

  it('shows an empty state when nothing is saved', async () => {
    mocked.getCustomerMenu.mockResolvedValue({ categories: [] })
    render(<CustomerMenuPreview restaurantId="r1" onBack={() => {}} />)
    expect(await screen.findByText('No menu items yet')).toBeInTheDocument()
  })
})
