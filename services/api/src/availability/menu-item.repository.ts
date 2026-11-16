import type { MenuItem } from './menu-item';

export interface MenuItemRepository {
  findById(itemId: string): Promise<MenuItem | undefined>;
  listByRestaurant(restaurantId: string): Promise<MenuItem[]>;
  setAvailability(itemId: string, available: boolean): Promise<MenuItem>;
}

export const MENU_ITEM_REPOSITORY = Symbol('MENU_ITEM_REPOSITORY');
