import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MENU_REPOSITORY, type MenuRepository } from './menu.repository';
import type { Menu, MenuItem } from './menu.types';
import { validateCategoryName, validateItemInput } from './menu.validation';

@Injectable()
export class MenuService {
  constructor(@Inject(MENU_REPOSITORY) private readonly repo: MenuRepository) {}

  getPartnerMenu(restaurantId: string): Promise<Menu> {
    return this.repo.listMenu(restaurantId);
  }

  /** Same saved rows as the partner view, so an edit is live at once; empty categories are hidden. */
  async getCustomerMenu(restaurantId: string): Promise<Menu> {
    const menu = await this.repo.listMenu(restaurantId);
    return { categories: menu.categories.filter((c) => c.items.length > 0) };
  }

  async createCategory(restaurantId: string, name: unknown) {
    return this.repo.createCategory(restaurantId, validateCategoryName(name));
  }

  async renameCategory(restaurantId: string, categoryId: string, name: unknown): Promise<void> {
    const found = await this.repo.renameCategory(restaurantId, categoryId, validateCategoryName(name));
    if (!found) throw new NotFoundException('Category not found');
  }

  async deleteCategory(restaurantId: string, categoryId: string): Promise<void> {
    const count = await this.repo.countItemsInCategory(restaurantId, categoryId);
    if (count === null) throw new NotFoundException('Category not found');
    if (count > 0) {
      throw new ConflictException(`It still has ${count} ${count === 1 ? 'item' : 'items'}`);
    }
    await this.repo.deleteCategory(restaurantId, categoryId);
  }

  async reorderCategories(restaurantId: string, categoryIds: unknown): Promise<void> {
    const menu = await this.repo.listMenu(restaurantId);
    const existing = menu.categories.map((c) => c.id).sort();
    const given = Array.isArray(categoryIds) ? categoryIds.map(String) : [];
    const sameSet =
      given.length === existing.length && [...given].sort().every((id, i) => id === existing[i]);
    if (!sameSet) throw new BadRequestException('Send every category id exactly once');
    await this.repo.reorderCategories(restaurantId, given);
  }

  async createItem(restaurantId: string, categoryId: string, input: unknown): Promise<MenuItem> {
    const item = await this.repo.createItem(restaurantId, categoryId, validateItemInput(input));
    if (!item) throw new NotFoundException('Category not found');
    return item;
  }

  async updateItem(restaurantId: string, itemId: string, input: unknown): Promise<MenuItem> {
    const item = await this.repo.replaceItem(restaurantId, itemId, validateItemInput(input));
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }

  async deleteItem(restaurantId: string, itemId: string): Promise<void> {
    if (!(await this.repo.deleteItem(restaurantId, itemId))) {
      throw new NotFoundException('Item not found');
    }
  }
}
