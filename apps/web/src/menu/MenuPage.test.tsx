import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { Menu, MenuItem } from './types'
import * as api from './menuApi'
import MenuPage from './MenuPage'

vi.mock('./menuApi', () => ({
  getPartnerMenu: vi.fn(),
  createCategory: vi.fn(),
  renameCategory: vi.fn(),
  deleteCategory: vi.fn(),
  reorderCategories: vi.fn(),
  saveItem: vi.fn(),
  deleteItem: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number
    constructor(status: number, message: string) {
      super(message)
      this.status = status
    }
  },
}))

const mocked = vi.mocked(api)

const bhaji: MenuItem = {
  id: 'i1',
  name: 'Onion bhaji',
  description: 'Crisp fried onion',
  priceMinor: 450,
  variants: [],
}

const menuOf = (...categories: Menu['categories']): Menu => ({ categories })
const starters = (items: MenuItem[] = []) => ({ id: 'c1', name: 'Starters', items })
const mains = { id: 'c2', name: 'Mains', items: [] as MenuItem[] }

async function renderPage(menu: Menu) {
  mocked.getPartnerMenu.mockResolvedValue(menu)
  render(<MenuPage onPreview={() => {}} />)
  await screen.findByRole('heading', { name: 'Menu' })
  await waitFor(() => expect(screen.queryByRole('status', { name: 'Loading your menu' })).toBeNull())
}

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))
const type = (label: string | RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } })

beforeEach(() => {
  vi.resetAllMocks()
})

describe('MenuPage states', () => {
  it('shows an empty state with one action', async () => {
    await renderPage(menuOf())
    expect(screen.getByText('Your menu is empty')).toBeInTheDocument()
  })

  it('shows an error with retry', async () => {
    mocked.getPartnerMenu.mockRejectedValueOnce(new Error('down'))
    render(<MenuPage onPreview={() => {}} />)
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load your menu")
    mocked.getPartnerMenu.mockResolvedValue(menuOf(starters()))
    click('Try again')
    expect(await screen.findByRole('heading', { name: 'Starters' })).toBeInTheDocument()
  })
})

describe('categories', () => {
  it('AC1: creates a category', async () => {
    await renderPage(menuOf())
    mocked.createCategory.mockResolvedValue({ id: 'c1', name: 'Starters' })
    // an empty menu offers the action twice: in the header and in the empty state
    fireEvent.click(screen.getAllByRole('button', { name: 'Add category' })[0])
    type('Category name', 'Starters')
    click('Save category')
    expect(await screen.findByRole('heading', { name: 'Starters' })).toBeInTheDocument()
    expect(mocked.createCategory).toHaveBeenCalledWith('Starters')
  })

  it('refuses an empty category name', async () => {
    await renderPage(menuOf(starters()))
    click('Add category')
    click('Save category')
    expect(screen.getByText(/Category name is required/)).toBeInTheDocument()
    expect(mocked.createCategory).not.toHaveBeenCalled()
  })

  it('AC2: renames a category', async () => {
    await renderPage(menuOf(starters()))
    mocked.renameCategory.mockResolvedValue(undefined)
    click('Rename Starters')
    type('Category name', 'Sharers')
    click('Save category')
    expect(await screen.findByRole('heading', { name: 'Sharers' })).toBeInTheDocument()
    expect(mocked.renameCategory).toHaveBeenCalledWith('c1', 'Sharers')
  })

  it('AC3: deletes an empty category after confirming', async () => {
    await renderPage(menuOf(starters()))
    mocked.deleteCategory.mockResolvedValue(undefined)
    click('Delete Starters')
    expect(screen.getByRole('alertdialog', { name: 'Delete Starters?' })).toBeInTheDocument()
    click('Delete category')
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Starters' })).toBeNull())
    expect(mocked.deleteCategory).toHaveBeenCalledWith('c1')
  })

  it('AC11: refuses deleting a category that has items', async () => {
    await renderPage(menuOf(starters([bhaji])))
    click('Delete Starters')
    expect(screen.getByRole('alert')).toHaveTextContent(/Couldn't delete Starters/)
    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(mocked.deleteCategory).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: 'Starters' })).toBeInTheDocument()
  })

  it('AC10: moves a category up and saves at once', async () => {
    await renderPage(menuOf(starters(), mains))
    mocked.reorderCategories.mockResolvedValue(undefined)
    expect(screen.getByRole('button', { name: 'Move Starters up' })).toBeDisabled()
    click('Move Mains up')
    await waitFor(() => expect(mocked.reorderCategories).toHaveBeenCalledWith(['c2', 'c1']))
    expect(await screen.findByText('Category order saved. Customers see the new order.')).toBeInTheDocument()
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(headings.indexOf('Mains')).toBeLessThan(headings.indexOf('Starters'))
  })
})

describe('items', () => {
  it('AC4: adds an item with a price', async () => {
    await renderPage(menuOf(starters()))
    mocked.saveItem.mockResolvedValue({ ...bhaji, description: null })
    click('Add item to Starters')
    type('Item name', 'Onion bhaji')
    type(/^Price/, '4.50')
    click('Save item')
    expect(await screen.findByText('£4.50')).toBeInTheDocument()
    expect(mocked.saveItem).toHaveBeenCalledWith('c1', null, {
      name: 'Onion bhaji',
      description: '',
      priceMinor: 450,
      variants: [],
    })
  })

  it('AC5: edits the price', async () => {
    await renderPage(menuOf(starters([bhaji])))
    mocked.saveItem.mockResolvedValue({ ...bhaji, priceMinor: 500 })
    click('Edit Onion bhaji')
    expect(screen.getByLabelText(/^Price/)).toHaveValue('4.50')
    type(/^Price/, '5.00')
    click('Save item')
    expect(await screen.findByText('£5.00')).toBeInTheDocument()
    expect(mocked.saveItem).toHaveBeenCalledWith('c1', 'i1', expect.objectContaining({ priceMinor: 500 }))
  })

  it('AC6: removes an item after confirming', async () => {
    await renderPage(menuOf(starters([bhaji])))
    mocked.deleteItem.mockResolvedValue(undefined)
    click('Remove Onion bhaji')
    click('Remove item')
    await waitFor(() => expect(screen.queryByText('Onion bhaji')).toBeNull())
    expect(mocked.deleteItem).toHaveBeenCalledWith('i1')
  })

  it('AC7: adds a size variant with its own price', async () => {
    await renderPage(menuOf(starters()))
    const biryani: MenuItem = {
      id: 'i2',
      name: 'Biryani',
      description: null,
      priceMinor: 900,
      variants: [{ id: 'v1', name: 'Large', priceMinor: 1400 }],
    }
    mocked.saveItem.mockResolvedValue(biryani)
    click('Add item to Starters')
    type('Item name', 'Biryani')
    type(/^Price/, '9.00')
    click('Add size variant')
    type('Size name', 'Large')
    fireEvent.change(screen.getAllByLabelText(/^Price/)[1], { target: { value: '14.00' } })
    click('Save item')
    const sizes = await screen.findByRole('list', { name: 'Sizes for Biryani' })
    expect(within(sizes).getByText('Large')).toBeInTheDocument()
    expect(within(sizes).getByText('£14.00')).toBeInTheDocument()
    expect(mocked.saveItem).toHaveBeenCalledWith(
      'c1',
      null,
      expect.objectContaining({ variants: [{ name: 'Large', priceMinor: 1400 }] }),
    )
  })

  it('AC13: refuses sizes without an item price', async () => {
    await renderPage(menuOf(starters()))
    click('Add item to Starters')
    type('Item name', 'Pizza')
    click('Add size variant')
    type('Size name', 'Large')
    fireEvent.change(screen.getAllByLabelText(/^Price/)[1], { target: { value: '14.00' } })
    click('Save item')
    expect(screen.getByText(/Price is required when the item has sizes/)).toBeInTheDocument()
    expect(screen.getAllByLabelText(/^Price/)[0]).toHaveAttribute('aria-invalid', 'true')
    expect(mocked.saveItem).not.toHaveBeenCalled()
  })

  it('AC14: refuses an empty name when adding and when editing', async () => {
    await renderPage(menuOf(starters([bhaji])))
    click('Add item to Starters')
    type(/^Price/, '4.50')
    click('Save item')
    expect(screen.getByText(/Item name is required/)).toBeInTheDocument()
    click('Cancel')
    click('Edit Onion bhaji')
    type('Item name', '  ')
    click('Save item')
    expect(screen.getByText(/Item name is required/)).toBeInTheDocument()
    expect(mocked.saveItem).not.toHaveBeenCalled()
  })

  it.each(['0', '-3'])('AC15: refuses a price of %s', async (price) => {
    await renderPage(menuOf(starters()))
    click('Add item to Starters')
    type('Item name', 'Soup')
    type(/^Price/, price)
    click('Save item')
    expect(screen.getByText(/Price must be more than 0/)).toBeInTheDocument()
    expect(mocked.saveItem).not.toHaveBeenCalled()
  })

  it('closes the drawer on Escape and returns focus', async () => {
    await renderPage(menuOf(starters()))
    const opener = screen.getByRole('button', { name: 'Add item to Starters' })
    opener.focus()
    fireEvent.click(opener)
    expect(screen.getByRole('dialog', { name: 'Add item' })).toBeInTheDocument()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(opener).toHaveFocus()
  })
})
