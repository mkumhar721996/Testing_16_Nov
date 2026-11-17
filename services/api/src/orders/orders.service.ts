import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CLOCK, type Clock } from '../common/clock';
import { isOpenAt } from '../opening-hours/opening-hours.domain';
import { OPENING_HOURS_REPOSITORY, type OpeningHoursRepository } from '../opening-hours/opening-hours.repository';
import { ORDERS_REPOSITORY, type OrdersRepository, type PlacedOrder } from './orders.repository';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(OPENING_HOURS_REPOSITORY) private readonly hours: OpeningHoursRepository,
    @Inject(ORDERS_REPOSITORY) private readonly orders: OrdersRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** Records a placement only while the restaurant can fulfil it; refusals store nothing. */
  async placeOrder(restaurantId: string, now: Date = this.clock.now()): Promise<PlacedOrder> {
    // Read fresh on every call (no cache) so a temporary closure applies to the very next order.
    const restaurant = await this.hours.find(restaurantId);
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    if (restaurant.temporarilyClosed) {
      throw new ConflictException({
        code: 'TEMPORARILY_CLOSED',
        message: 'The restaurant is temporarily closed and is not taking orders.',
      });
    }
    if (!isOpenAt(restaurant.hours, false, now, restaurant.timeZone)) {
      throw new ConflictException({
        code: 'OUTSIDE_OPENING_HOURS',
        message: 'The restaurant is outside its opening hours.',
      });
    }
    return this.orders.insertPlaced(restaurantId);
  }
}
