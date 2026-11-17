export type ListingStatus = 'pending' | 'approved' | 'rejected'

export interface Listing {
  id: string
  name: string
  cuisine: string
  addressCity: string
  description: string
  status: ListingStatus
}

export type ListingInput = Omit<Listing, 'id' | 'status'>

export class ApiError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const baseUrl = import.meta.env.VITE_API_URL ?? ''

// INTERIM: no sign-in exists yet, so the acting user comes from dev-only config
// and is sent as headers the API's ActorGuard reads. Replace with real auth.
export const devActor = {
  id: import.meta.env.VITE_ACTOR_ID ?? 'dev-partner',
  role: import.meta.env.VITE_ACTOR_ROLE ?? 'partner',
}

async function request<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: init.method ?? 'GET',
    headers: {
      'content-type': 'application/json',
      'x-user-id': devActor.id,
      'x-user-role': devActor.role,
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
  if (!response.ok) {
    const detail = (await response.json().catch(() => null)) as { message?: unknown } | null
    throw new ApiError(response.status, typeof detail?.message === 'string' ? detail.message : response.statusText)
  }
  return (await response.json()) as T
}

export interface MenuSize {
  name: string
  price: number
}

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number | null
  available: boolean
  sizes: MenuSize[]
}

export interface MenuCategory {
  id: string
  name: string
  items: MenuItem[]
}

/** weekday is ISO: 1 = Monday ... 7 = Sunday; times are 'HH:MM' local to the restaurant. */
export interface OpeningSlot {
  weekday: number
  opens: string
  closes: string
}

export interface RestaurantPageData {
  id: string
  name: string
  cuisine: string
  addressCity: string
  description: string
  isOpen: boolean
  temporarilyClosed: boolean
  closesAt: string | null
  today: number
  nextOpening: { weekday: number; opens: string } | null
  hours: OpeningSlot[]
  categories: MenuCategory[]
}

export const getRestaurant = (id: string) => request<RestaurantPageData>(`/restaurants/${encodeURIComponent(id)}`)

export const createListing = (input: ListingInput) =>
  request<Listing>('/restaurant-listings', { method: 'POST', body: input })

export const getMyListing = () => request<Listing>('/restaurant-listings/mine')

export const updateMyListing = (input: ListingInput) =>
  request<Listing>('/restaurant-listings/mine', { method: 'PUT', body: input })

export const listPending = () => request<Listing[]>('/admin/restaurant-listings?status=pending')

export const approveListing = (id: string) =>
  request<Listing>(`/admin/restaurant-listings/${encodeURIComponent(id)}/approve`, { method: 'POST' })

export const rejectListing = (id: string) =>
  request<Listing>(`/admin/restaurant-listings/${encodeURIComponent(id)}/reject`, { method: 'POST' })
