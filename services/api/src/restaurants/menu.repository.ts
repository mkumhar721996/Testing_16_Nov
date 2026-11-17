import type { MenuCategory, RestaurantSchedule } from './menu.types';

export interface MenuRepository {
  /** Ordered by position, with items and sizes nested. */
  listMenu(listingId: string): Promise<MenuCategory[]>;
  getSchedule(listingId: string): Promise<RestaurantSchedule>;
}

export const MENU_REPOSITORY = Symbol('MENU_REPOSITORY');
