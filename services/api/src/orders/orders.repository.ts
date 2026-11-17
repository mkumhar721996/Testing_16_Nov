import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { DB_POOL } from '../opening-hours/opening-hours.repository';

export const ORDERS_REPOSITORY = 'ORDERS_REPOSITORY';

export interface PlacedOrder {
  id: string;
  restaurantId: string;
  status: 'placed';
}

export interface OrdersRepository {
  insertPlaced(restaurantId: string): Promise<PlacedOrder>;
}

@Injectable()
export class PgOrdersRepository implements OrdersRepository {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

  async insertPlaced(restaurantId: string): Promise<PlacedOrder> {
    const id = randomUUID();
    await this.pool.query("insert into orders (id, restaurant_id, status) values ($1, $2, 'placed')", [id, restaurantId]);
    return { id, restaurantId, status: 'placed' };
  }
}
