export interface PartnerItem {
  id: string
  name: string
  available: boolean
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

// Development-only stand-in for real partner authentication.
const partnerHeaders = {
  'x-partner-restaurant-id': import.meta.env.VITE_PARTNER_RESTAURANT_ID ?? 'r1',
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'content-type': 'application/json', ...partnerHeaders },
  })
  if (!res.ok) throw new ApiError(res.status, res.statusText)
  return (await res.json()) as T
}

export function fetchPartnerMenu(): Promise<PartnerItem[]> {
  return request('/partner/items')
}

export function setItemAvailable(itemId: string, available: boolean): Promise<PartnerItem> {
  return request(`/partner/items/${encodeURIComponent(itemId)}/availability`, {
    method: 'PATCH',
    body: JSON.stringify({ available }),
  })
}
