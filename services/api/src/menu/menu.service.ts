import { Inject, Injectable } from '@nestjs/common';
import type { MenuItem } from '../availability/menu-item';
import { MENU_ITEM_REPOSITORY, type MenuItemRepository } from '../availability/menu-item.repository';

@Injectable()
export class MenuService {
  constructor(@Inject(MENU_ITEM_REPOSITORY) private readonly repo: MenuItemRepository) {}

  // Sold-out items stay listed, flagged unavailable. Read live on every call.
  getMenu(restaurantId: string): Promise<MenuItem[]> {
    return this.repo.listByRestaurant(restaurantId);
  }
}
