import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { migrate } from '../db/migrate';
import { PgListingRepository } from './pg-listing.repository';
import { PgMenuRepository } from './pg-menu.repository';

const databaseUrl = process.env.DATABASE_URL;
const input = { name: 'Saffron & Spice', cuisine: 'Indian', addressCity: 'Leeds', description: 'Family-run' };

describe.runIf(databaseUrl)('PgMenuRepository (PostgreSQL)', () => {
  const pool = new pg.Pool({ connectionString: databaseUrl });
  const listings = new PgListingRepository(pool);
  const menu = new PgMenuRepository(pool);

  beforeAll(async () => {
    await migrate(pool);
  });
  beforeEach(async () => {
    await pool.query('DELETE FROM restaurant_listings');
  });
  afterAll(async () => {
    await pool.end();
  });

  it('gives defaults and an empty menu to a listing with no menu rows', async () => {
    const listing = await listings.insert('p1', input);
    expect(await menu.getSchedule(listing.id)).toEqual({ timezone: 'Europe/London', temporarilyClosed: false, slots: [] });
    expect(await menu.listMenu(listing.id)).toEqual([]);
  });

  it('reads categories, items, sizes and slots with numeric prices and HH:MM times', async () => {
    const listing = await listings.insert('p1', input);
    const cat = await pool.query<{ id: string }>(
      "INSERT INTO menu_categories (id, listing_id, name) VALUES (gen_random_uuid(), $1, 'Mains') RETURNING id",
      [listing.id],
    );
    const item = await pool.query<{ id: string }>(
      `INSERT INTO menu_items (id, category_id, name, price, available)
       VALUES (gen_random_uuid(), $1, 'Chicken tikka masala', 12.50, false) RETURNING id`,
      [cat.rows[0].id],
    );
    const sized = await pool.query<{ id: string }>(
      "INSERT INTO menu_items (id, category_id, name, position) VALUES (gen_random_uuid(), $1, 'Lamb biryani', 1) RETURNING id",
      [cat.rows[0].id],
    );
    await pool.query(
      "INSERT INTO menu_item_sizes (id, item_id, name, price) VALUES (gen_random_uuid(), $1, 'Regular', 9.00)",
      [sized.rows[0].id],
    );
    await pool.query(
      "INSERT INTO opening_slots (id, listing_id, weekday, opens, closes) VALUES (gen_random_uuid(), $1, 5, '18:00', '22:30')",
      [listing.id],
    );

    const [category] = await menu.listMenu(listing.id);
    expect(item.rows).toHaveLength(1);
    expect(category.items[0]).toMatchObject({ name: 'Chicken tikka masala', price: 12.5, available: false, sizes: [] });
    expect(category.items[1]).toMatchObject({ price: null, sizes: [{ name: 'Regular', price: 9 }] });
    expect((await menu.getSchedule(listing.id)).slots).toEqual([{ weekday: 5, opens: '18:00', closes: '22:30' }]);
  });
});
