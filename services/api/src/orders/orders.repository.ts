import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import {
  DB_POOL,
  FIND_SQL,
  toRestaurantHours,
  type RestaurantHours,
  type Row,
} from '../opening-hours/opening-hours.repository';

export const ORDERS_REPOSITORY = 'ORDERS_REPOSITORY';

export interface PlacedOrder {
  id: string;
  restaurantId: string;
  status: 'placed';
}

/** Throws to refuse the order; receives null when the restaurant does not exist. */
export type OrderGate = (restaurant: RestaurantHours | null) => void;

export interface OrdersRepository {
  /**
   * Runs the gate and the insert as one atomic step against the restaurant's current state,
   * so a close committed before this call returns can never be followed by an accepted order.
   */
  placeIfAllowed(restaurantId: string, gate: OrderGate): Promise<PlacedOrder>;
}

@Injectable()
export class PgOrdersRepository implements OrdersRepository {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

  async placeIfAllowed(restaurantId: string, gate: OrderGate): Promise<PlacedOrder> {
    const client = await this.pool.connect();
    try {
      await client.query('begin');
      // A shared row lock makes a concurrent close wait for this order, and a later order see the close.
      const { rows } = await client.query<Row>(`${FIND_SQL} for share of r`, [restaurantId]);
      gate(toRestaurantHours(rows));
      const id = randomUUID();
      await client.query("insert into orders (id, restaurant_id, status) values ($1, $2, 'placed')", [id, restaurantId]);
      await client.query('commit');
      return { id, restaurantId, status: 'placed' };
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  }
}
