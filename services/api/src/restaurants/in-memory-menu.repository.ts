import type { MenuRepository } from './menu.repository';
import type { MenuCategory, RestaurantSchedule } from './menu.types';

const EMPTY_SCHEDULE: RestaurantSchedule = { timezone: 'Europe/London', temporarilyClosed: false, slots: [] };

export class InMemoryMenuRepository implements MenuRepository {
  private readonly menus = new Map<string, MenuCategory[]>();
  private readonly schedules = new Map<string, RestaurantSchedule>();

  /** Test seeding helper. */
  seed(listingId: string, categories: MenuCategory[], schedule: RestaurantSchedule = EMPTY_SCHEDULE): void {
    this.menus.set(listingId, categories);
    this.schedules.set(listingId, schedule);
  }

  async listMenu(listingId: string): Promise<MenuCategory[]> {
    return this.menus.get(listingId) ?? [];
  }

  async getSchedule(listingId: string): Promise<RestaurantSchedule> {
    return this.schedules.get(listingId) ?? EMPTY_SCHEDULE;
  }
}
