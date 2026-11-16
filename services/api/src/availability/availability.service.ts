import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { MenuItem } from './menu-item';
import { MENU_ITEM_REPOSITORY, type MenuItemRepository } from './menu-item.repository';

@Injectable()
export class AvailabilityService {
  constructor(@Inject(MENU_ITEM_REPOSITORY) private readonly repo: MenuItemRepository) {}

  listItems(partnerRestaurantId: string): Promise<MenuItem[]> {
    return this.repo.listByRestaurant(partnerRestaurantId);
  }

  async setAvailability(partnerRestaurantId: string, itemId: string, available: boolean): Promise<MenuItem> {
    const item = await this.repo.findById(itemId);
    if (!item) throw new NotFoundException(`Item ${itemId} not found`);
    if (item.restaurantId !== partnerRestaurantId) {
      throw new ForbiddenException("Item belongs to another restaurant");
    }
    return this.repo.setAvailability(itemId, available);
  }
}
