import type { MenuItem } from './menu-item';

export function item(id: string, restaurantId: string, overrides: Partial<MenuItem> = {}): MenuItem {
  return { id, restaurantId, name: `Item ${id}`, description: '', priceMinor: 500, available: true, ...overrides };
}
