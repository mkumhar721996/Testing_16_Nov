import { randomUUID } from 'node:crypto';
import pg from 'pg';
import type { MenuRepository } from './menu.repository';
import type { ItemInput, Menu, MenuItem } from './menu.types';

export function createPool(connectionString = process.env.DATABASE_URL): pg.Pool {
  // The pool connects lazily, so the API still boots (e.g. for /health) without a database.
  return new pg.Pool({ connectionString });
}

interface ItemRow {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price_minor: number;
}

/** Every query filters on restaurant_id, so one restaurant never reaches another's rows. */
export class PgMenuRepository implements MenuRepository {
  constructor(private readonly pool: pg.Pool) {}

  private async inTransaction<T>(work: (client: pg.PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async insertVariants(client: pg.PoolClient, itemId: string, input: ItemInput) {
    const variants = [];
    for (const [position, variant] of input.variants.entries()) {
      const id = randomUUID();
      await client.query(
        'INSERT INTO menu_item_variants (id, item_id, name, price_minor, position) VALUES ($1, $2, $3, $4, $5)',
        [id, itemId, variant.name, variant.priceMinor, position],
      );
      variants.push({ id, ...variant });
    }
    return variants;
  }

  async listMenu(restaurantId: string): Promise<Menu> {
    const categories = await this.pool.query<{ id: string; name: string }>(
      'SELECT id, name FROM menu_categories WHERE restaurant_id = $1 ORDER BY position',
      [restaurantId],
    );
    const items = await this.pool.query<ItemRow>(
      'SELECT id, category_id, name, description, price_minor FROM menu_items WHERE restaurant_id = $1 ORDER BY name, id',
      [restaurantId],
    );
    const variants = await this.pool.query<{
      id: string;
      item_id: string;
      name: string;
      price_minor: number;
    }>(
      `SELECT v.id, v.item_id, v.name, v.price_minor FROM menu_item_variants v
       JOIN menu_items i ON i.id = v.item_id WHERE i.restaurant_id = $1 ORDER BY v.position`,
      [restaurantId],
    );
    const toItem = (row: ItemRow): MenuItem => ({
      id: row.id,
      name: row.name,
      description: row.description,
      priceMinor: row.price_minor,
      variants: variants.rows
        .filter((v) => v.item_id === row.id)
        .map((v) => ({ id: v.id, name: v.name, priceMinor: v.price_minor })),
    });
    return {
      categories: categories.rows.map((c) => ({
        id: c.id,
        name: c.name,
        items: items.rows.filter((i) => i.category_id === c.id).map(toItem),
      })),
    };
  }

  async createCategory(restaurantId: string, name: string) {
    const id = randomUUID();
    await this.pool.query(
      `INSERT INTO menu_categories (id, restaurant_id, name, position)
       VALUES ($1, $2, $3, (SELECT COALESCE(MAX(position) + 1, 0) FROM menu_categories WHERE restaurant_id = $2))`,
      [id, restaurantId, name],
    );
    return { id, name };
  }

  async renameCategory(restaurantId: string, categoryId: string, name: string) {
    const result = await this.pool.query(
      'UPDATE menu_categories SET name = $3 WHERE id = $1 AND restaurant_id = $2',
      [categoryId, restaurantId, name],
    );
    return result.rowCount === 1;
  }

  async countItemsInCategory(restaurantId: string, categoryId: string) {
    const result = await this.pool.query<{ count: string }>(
      `SELECT (SELECT COUNT(*) FROM menu_items WHERE category_id = c.id) AS count
       FROM menu_categories c WHERE c.id = $1 AND c.restaurant_id = $2`,
      [categoryId, restaurantId],
    );
    return result.rows.length === 0 ? null : Number(result.rows[0].count);
  }

  async deleteCategory(restaurantId: string, categoryId: string) {
    await this.pool.query('DELETE FROM menu_categories WHERE id = $1 AND restaurant_id = $2', [
      categoryId,
      restaurantId,
    ]);
  }

  async reorderCategories(restaurantId: string, orderedIds: string[]) {
    await this.inTransaction(async (client) => {
      for (const [position, id] of orderedIds.entries()) {
        await client.query(
          'UPDATE menu_categories SET position = $3 WHERE id = $1 AND restaurant_id = $2',
          [id, restaurantId, position],
        );
      }
    });
  }

  async createItem(restaurantId: string, categoryId: string, input: ItemInput) {
    return this.inTransaction(async (client) => {
      const owned = await client.query(
        'SELECT 1 FROM menu_categories WHERE id = $1 AND restaurant_id = $2',
        [categoryId, restaurantId],
      );
      if (owned.rowCount === 0) return null;
      const id = randomUUID();
      await client.query(
        'INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price_minor) VALUES ($1, $2, $3, $4, $5, $6)',
        [id, restaurantId, categoryId, input.name, input.description, input.priceMinor],
      );
      const variants = await this.insertVariants(client, id, input);
      return {
        id,
        name: input.name,
        description: input.description,
        priceMinor: input.priceMinor,
        variants,
      };
    });
  }

  async replaceItem(restaurantId: string, itemId: string, input: ItemInput) {
    return this.inTransaction(async (client) => {
      const updated = await client.query(
        'UPDATE menu_items SET name = $3, description = $4, price_minor = $5 WHERE id = $1 AND restaurant_id = $2',
        [itemId, restaurantId, input.name, input.description, input.priceMinor],
      );
      if (updated.rowCount === 0) return null;
      await client.query('DELETE FROM menu_item_variants WHERE item_id = $1', [itemId]);
      const variants = await this.insertVariants(client, itemId, input);
      return {
        id: itemId,
        name: input.name,
        description: input.description,
        priceMinor: input.priceMinor,
        variants,
      };
    });
  }

  async deleteItem(restaurantId: string, itemId: string) {
    const result = await this.pool.query(
      'DELETE FROM menu_items WHERE id = $1 AND restaurant_id = $2',
      [itemId, restaurantId],
    );
    return result.rowCount === 1;
  }
}
