import { randomUUID } from 'node:crypto';
import type { MenuRepository } from './menu.repository';
import type { ItemInput, Menu, MenuItem } from './menu.types';

interface CategoryRow {
  id: string;
  restaurantId: string;
  name: string;
}

interface ItemRow {
  restaurantId: string;
  categoryId: string;
  item: MenuItem;
}

function withIds(input: ItemInput, id: string): MenuItem {
  return {
    id,
    name: input.name,
    description: input.description,
    priceMinor: input.priceMinor,
    variants: input.variants.map((v) => ({ id: randomUUID(), ...v })),
  };
}

export class InMemoryMenuRepository implements MenuRepository {
  // Array order is the category position.
  private categories: CategoryRow[] = [];
  private items: ItemRow[] = [];

  private ownCategories(restaurantId: string): CategoryRow[] {
    return this.categories.filter((c) => c.restaurantId === restaurantId);
  }

  async listMenu(restaurantId: string): Promise<Menu> {
    return structuredClone({
      categories: this.ownCategories(restaurantId).map((c) => ({
        id: c.id,
        name: c.name,
        items: this.items
          .filter((i) => i.categoryId === c.id && i.restaurantId === restaurantId)
          .map((i) => i.item),
      })),
    });
  }

  async createCategory(restaurantId: string, name: string) {
    const row = { id: randomUUID(), restaurantId, name };
    this.categories.push(row);
    return { id: row.id, name };
  }

  async renameCategory(restaurantId: string, categoryId: string, name: string) {
    const row = this.ownCategories(restaurantId).find((c) => c.id === categoryId);
    if (!row) return false;
    row.name = name;
    return true;
  }

  async countItemsInCategory(restaurantId: string, categoryId: string) {
    if (!this.ownCategories(restaurantId).some((c) => c.id === categoryId)) return null;
    return this.items.filter((i) => i.categoryId === categoryId).length;
  }

  async deleteCategory(restaurantId: string, categoryId: string) {
    this.categories = this.categories.filter(
      (c) => !(c.id === categoryId && c.restaurantId === restaurantId),
    );
  }

  async reorderCategories(restaurantId: string, orderedIds: string[]) {
    const own = this.ownCategories(restaurantId);
    const reordered = orderedIds.map((id) => own.find((c) => c.id === id)!);
    const others = this.categories.filter((c) => c.restaurantId !== restaurantId);
    this.categories = [...others, ...reordered];
  }

  async createItem(restaurantId: string, categoryId: string, input: ItemInput) {
    if (!this.ownCategories(restaurantId).some((c) => c.id === categoryId)) return null;
    const item = withIds(input, randomUUID());
    this.items.push({ restaurantId, categoryId, item });
    return structuredClone(item);
  }

  async replaceItem(restaurantId: string, itemId: string, input: ItemInput) {
    const row = this.items.find((i) => i.item.id === itemId && i.restaurantId === restaurantId);
    if (!row) return null;
    row.item = withIds(input, itemId);
    return structuredClone(row.item);
  }

  async deleteItem(restaurantId: string, itemId: string) {
    const before = this.items.length;
    this.items = this.items.filter((i) => !(i.item.id === itemId && i.restaurantId === restaurantId));
    return this.items.length < before;
  }
}
