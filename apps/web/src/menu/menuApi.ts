import type { ItemInput, Menu, MenuItem } from './types'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const baseUrl: string = import.meta.env.VITE_API_URL ?? ''
// Development stand-in for sign-in: the API's PARTNER_AUTH_STUB reads this header. Replace with real auth.
const devRestaurantId: string | undefined = import.meta.env.VITE_RESTAURANT_ID

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (devRestaurantId) headers['X-Restaurant-Id'] = devRestaurantId
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!response.ok) {
    let message = response.statusText
    try {
      const data = await response.json()
      const detail = data.message
      message = typeof detail === 'string' ? detail : Object.values(detail ?? {}).join(' ') || message
    } catch {
      // keep the status text
    }
    throw new ApiError(response.status, message)
  }
  return response.status === 204 ? (undefined as T) : ((await response.json()) as T)
}

export const getPartnerMenu = () => request<Menu>('GET', '/partner/menu')

export const createCategory = (name: string) =>
  request<{ id: string; name: string }>('POST', '/partner/menu/categories', { name })

export const renameCategory = (id: string, name: string) =>
  request<void>('PATCH', `/partner/menu/categories/${id}`, { name })

export const deleteCategory = (id: string) => request<void>('DELETE', `/partner/menu/categories/${id}`)

export const reorderCategories = (categoryIds: string[]) =>
  request<void>('PUT', '/partner/menu/categories/order', { categoryIds })

/** Creates the item in the category when itemId is null, otherwise replaces the item. */
export const saveItem = (categoryId: string, itemId: string | null, input: ItemInput) =>
  itemId
    ? request<MenuItem>('PUT', `/partner/menu/items/${itemId}`, input)
    : request<MenuItem>('POST', `/partner/menu/categories/${categoryId}/items`, input)

export const deleteItem = (id: string) => request<void>('DELETE', `/partner/menu/items/${id}`)

export const getCustomerMenu = (restaurantId: string) =>
  request<Menu>('GET', `/restaurants/${restaurantId}/menu`)
