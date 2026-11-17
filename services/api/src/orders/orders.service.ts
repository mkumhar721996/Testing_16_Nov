import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CLOCK, type Clock } from '../common/clock';
import { isOpenAt } from '../opening-hours/opening-hours.domain';
import { ORDERS_REPOSITORY, type OrdersRepository, type PlacedOrder } from './orders.repository';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(ORDERS_REPOSITORY) private readonly orders: OrdersRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** Records a placement only while the restaurant can fulfil it; refusals store nothing. */
  placeOrder(restaurantId: string, now: Date = this.clock.now()): Promise<PlacedOrder> {
    // The gate runs inside the repository's transaction, on state read fresh (no cache) and locked.
    return this.orders.placeIfAllowed(restaurantId, (restaurant) => {
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
    });
  }
}
