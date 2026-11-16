import type { MenuItem } from './menu-item';
import type { MenuItemRepository } from './menu-item.repository';

export class InMemoryMenuItemRepository implements MenuItemRepository {
  private readonly items = new Map<string, MenuItem>();

  constructor(seed: MenuItem[] = []) {
    for (const item of seed) this.items.set(item.id, { ...item });
  }

  async findById(itemId: string): Promise<MenuItem | undefined> {
    const found = this.items.get(itemId);
    return found && { ...found };
  }

  async listByRestaurant(restaurantId: string): Promise<MenuItem[]> {
    return [...this.items.values()].filter((i) => i.restaurantId === restaurantId).map((i) => ({ ...i }));
  }

  async setAvailability(itemId: string, available: boolean): Promise<MenuItem> {
    const found = this.items.get(itemId);
    if (!found) throw new Error(`Menu item ${itemId} not found`);
    found.available = available;
    return { ...found };
  }
}
