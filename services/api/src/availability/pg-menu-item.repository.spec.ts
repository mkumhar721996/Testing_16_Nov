import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PgMenuItemRepository } from './pg-menu-item.repository';

describe.skipIf(!process.env.DATABASE_URL)('PgMenuItemRepository', () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  beforeAll(async () => {
    await pool.query(`CREATE TABLE IF NOT EXISTS menu_items (
      id text PRIMARY KEY, restaurant_id text NOT NULL, name text NOT NULL,
      description text NOT NULL DEFAULT '', price_minor integer NOT NULL, available boolean NOT NULL DEFAULT true)`);
    await pool.query(
      `INSERT INTO menu_items (id, restaurant_id, name, price_minor) VALUES ('pg-i1', 'pg-r1', 'Dal', 700)
       ON CONFLICT (id) DO UPDATE SET available = true`,
    );
  });
  afterAll(async () => {
    await pool.query(`DELETE FROM menu_items WHERE id = 'pg-i1'`);
    await pool.end();
  });

  it('defaults to available and persists sold out across repository instances (AC 5)', async () => {
    expect((await new PgMenuItemRepository(pool).findById('pg-i1'))!.available).toBe(true);
    await new PgMenuItemRepository(pool).setAvailability('pg-i1', false);
    const fresh = new PgMenuItemRepository(pool);
    expect((await fresh.findById('pg-i1'))!.available).toBe(false);
    expect((await fresh.listByRestaurant('pg-r1'))).toHaveLength(1);
  });
});
