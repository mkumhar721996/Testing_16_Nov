import { randomUUID } from 'node:crypto';
import type { OpeningHoursRepository, RestaurantHours } from '../opening-hours/opening-hours.repository';
import type { WeekHours } from '../opening-hours/opening-hours.domain';
import type { OrderGate, OrdersRepository, PlacedOrder } from '../orders/orders.repository';

/** Test double standing in for PostgreSQL: one shared store behind both repositories. */
export class InMemoryStore implements OpeningHoursRepository, OrdersRepository {
  readonly restaurants = new Map<string, RestaurantHours>();
  readonly orders: PlacedOrder[] = [];

  addRestaurant(id: string, restaurant: Partial<RestaurantHours> = {}): void {
    this.restaurants.set(id, {
      city: 'Bogotá',
      timeZone: 'America/Bogota',
      temporarilyClosed: false,
      hours: { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] },
      ...restaurant,
    });
  }

  async find(restaurantId: string): Promise<RestaurantHours | null> {
    const found = this.restaurants.get(restaurantId);
    return found ? structuredClone(found) : null;
  }

  async replaceWeek(restaurantId: string, hours: WeekHours): Promise<void> {
    this.restaurants.get(restaurantId)!.hours = structuredClone(hours);
  }

  async setTemporarilyClosed(restaurantId: string, closed: boolean): Promise<void> {
    this.restaurants.get(restaurantId)!.temporarilyClosed = closed;
  }

  async placeIfAllowed(restaurantId: string, gate: OrderGate): Promise<PlacedOrder> {
    gate(await this.find(restaurantId));
    const order: PlacedOrder = { id: randomUUID(), restaurantId, status: 'placed' };
    this.orders.push(order);
    return order;
  }
}
