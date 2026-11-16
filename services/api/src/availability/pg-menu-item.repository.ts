import type pg from 'pg';
import type { MenuItem } from './menu-item';
import type { MenuItemRepository } from './menu-item.repository';

interface MenuItemRow {
  id: string;
  restaurant_id: string;
  name: string;
  description: string;
  price_minor: number;
  available: boolean;
}

const COLUMNS = 'id, restaurant_id, name, description, price_minor, available';

function toMenuItem(row: MenuItemRow): MenuItem {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    name: row.name,
    description: row.description,
    priceMinor: row.price_minor,
    available: row.available,
  };
}

export class PgMenuItemRepository implements MenuItemRepository {
  constructor(private readonly pool: pg.Pool) {}

  async findById(itemId: string): Promise<MenuItem | undefined> {
    const { rows } = await this.pool.query<MenuItemRow>(`SELECT ${COLUMNS} FROM menu_items WHERE id = $1`, [itemId]);
    return rows[0] && toMenuItem(rows[0]);
  }

  async listByRestaurant(restaurantId: string): Promise<MenuItem[]> {
    const { rows } = await this.pool.query<MenuItemRow>(
      `SELECT ${COLUMNS} FROM menu_items WHERE restaurant_id = $1 ORDER BY name, id`,
      [restaurantId],
    );
    return rows.map(toMenuItem);
  }

  async setAvailability(itemId: string, available: boolean): Promise<MenuItem> {
    const { rows } = await this.pool.query<MenuItemRow>(
      `UPDATE menu_items SET available = $2 WHERE id = $1 RETURNING ${COLUMNS}`,
      [itemId, available],
    );
    if (!rows[0]) throw new Error(`Menu item ${itemId} not found`);
    return toMenuItem(rows[0]);
  }
}
