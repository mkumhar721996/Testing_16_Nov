import { Inject, Injectable } from '@nestjs/common';
import pg from 'pg';
import type { MenuRepository } from './menu.repository';
import type { MenuCategory, MenuItem, RestaurantSchedule } from './menu.types';
import { PG_POOL } from './pg-listing.repository';

interface CategoryRow {
  id: string;
  name: string;
}
interface ItemRow {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: string | null;
  available: boolean;
}
interface SizeRow {
  item_id: string;
  name: string;
  price: string;
}

@Injectable()
export class PgMenuRepository implements MenuRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async listMenu(listingId: string): Promise<MenuCategory[]> {
    const categories = (
      await this.pool.query<CategoryRow>(
        'SELECT id, name FROM menu_categories WHERE listing_id = $1 ORDER BY position, id',
        [listingId],
      )
    ).rows;
    if (categories.length === 0) return [];
    const items = (
      await this.pool.query<ItemRow>(
        `SELECT i.id, i.category_id, i.name, i.description, i.price, i.available
         FROM menu_items i JOIN menu_categories c ON c.id = i.category_id
         WHERE c.listing_id = $1 ORDER BY i.position, i.id`,
        [listingId],
      )
    ).rows;
    const sizes = (
      await this.pool.query<SizeRow>(
        `SELECT s.item_id, s.name, s.price
         FROM menu_item_sizes s
         JOIN menu_items i ON i.id = s.item_id
         JOIN menu_categories c ON c.id = i.category_id
         WHERE c.listing_id = $1 ORDER BY s.position, s.id`,
        [listingId],
      )
    ).rows;

    const toItem = (r: ItemRow): MenuItem => ({
      id: r.id,
      name: r.name,
      description: r.description,
      price: r.price === null ? null : Number(r.price),
      available: r.available,
      sizes: sizes.filter((s) => s.item_id === r.id).map((s) => ({ name: s.name, price: Number(s.price) })),
    });
    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      items: items.filter((i) => i.category_id === c.id).map(toItem),
    }));
  }

  async getSchedule(listingId: string): Promise<RestaurantSchedule> {
    const listing = await this.pool.query<{ temporarily_closed: boolean; timezone: string }>(
      'SELECT temporarily_closed, timezone FROM restaurant_listings WHERE id = $1',
      [listingId],
    );
    const slots = await this.pool.query<{ weekday: number; opens: string; closes: string }>(
      `SELECT weekday, to_char(opens, 'HH24:MI') AS opens, to_char(closes, 'HH24:MI') AS closes
       FROM opening_slots WHERE listing_id = $1 ORDER BY weekday, opens`,
      [listingId],
    );
    return {
      timezone: listing.rows[0]?.timezone ?? 'Europe/London',
      temporarilyClosed: listing.rows[0]?.temporarily_closed ?? false,
      slots: slots.rows.map((s) => ({ weekday: Number(s.weekday), opens: s.opens, closes: s.closes })),
    };
  }
}
