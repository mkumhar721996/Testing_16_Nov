import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { LISTING_REPOSITORY, type ListingRepository } from './listing.repository';
import { MENU_REPOSITORY, type MenuRepository } from './menu.repository';
import { openStatus } from './open-status';
import type { RestaurantPageView } from './restaurant-page.view';

@Injectable()
export class RestaurantPageService {
  constructor(
    @Inject(LISTING_REPOSITORY) private readonly listings: ListingRepository,
    @Inject(MENU_REPOSITORY) private readonly menu: MenuRepository,
  ) {}

  /** Pending, rejected and unknown restaurants are all the same 404, so they cannot be told apart. */
  async getPage(id: string, now: Date = new Date()): Promise<RestaurantPageView> {
    const listing = await this.listings.findById(id);
    if (!listing || listing.status !== 'approved') throw new NotFoundException('Restaurant not found');
    const [categories, schedule] = await Promise.all([this.menu.listMenu(id), this.menu.getSchedule(id)]);
    const status = openStatus(schedule, now);
    return {
      id: listing.id,
      name: listing.name,
      cuisine: listing.cuisine,
      addressCity: listing.addressCity,
      description: listing.description,
      isOpen: status.isOpen,
      temporarilyClosed: schedule.temporarilyClosed,
      closesAt: status.closesAt,
      today: status.today,
      nextOpening: status.nextOpening,
      hours: schedule.slots,
      categories,
    };
  }
}
