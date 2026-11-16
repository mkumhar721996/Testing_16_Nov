import type { ItemInput, Menu, MenuItem } from './menu.types';

export const MENU_REPOSITORY = Symbol('MENU_REPOSITORY');

/** Every method is scoped to one restaurant; a row of another restaurant is never touched. */
export interface MenuRepository {
  listMenu(restaurantId: string): Promise<Menu>;
  createCategory(restaurantId: string, name: string): Promise<{ id: string; name: string }>;
  /** Returns false when the category is not this restaurant's. */
  renameCategory(restaurantId: string, categoryId: string, name: string): Promise<boolean>;
  /** Returns null when the category is not this restaurant's. */
  countItemsInCategory(restaurantId: string, categoryId: string): Promise<number | null>;
  deleteCategory(restaurantId: string, categoryId: string): Promise<void>;
  reorderCategories(restaurantId: string, orderedIds: string[]): Promise<void>;
  /** Returns null when the category is not this restaurant's. */
  createItem(restaurantId: string, categoryId: string, input: ItemInput): Promise<MenuItem | null>;
  /** Replaces name, description, price and the whole variants list. Null when not found. */
  replaceItem(restaurantId: string, itemId: string, input: ItemInput): Promise<MenuItem | null>;
  /** Returns false when the item is not this restaurant's. */
  deleteItem(restaurantId: string, itemId: string): Promise<boolean>;
}
