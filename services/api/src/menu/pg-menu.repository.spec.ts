import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type pg from 'pg';
import { PgMenuRepository, createPool } from './pg-menu.repository';

// Runs only against a real database: DATABASE_URL=postgres://... pnpm test
describe.skipIf(!process.env.DATABASE_URL)('PgMenuRepository', () => {
  let pool: pg.Pool;
  let repo: PgMenuRepository;
  const restaurantId = randomUUID();

  beforeAll(async () => {
    pool = createPool();
    repo = new PgMenuRepository(pool);
    await pool.query('DROP TABLE IF EXISTS menu_item_variants, menu_items, menu_categories');
    await pool.query(readFileSync(join(__dirname, '../../db/migrations/0001_menu.sql'), 'utf8'));
  });

  afterAll(async () => {
    await pool.end();
  });

  it('the database refuses deleting a category that still has items (AC 11)', async () => {
    const category = await repo.createCategory(restaurantId, 'Starters');
    await repo.createItem(restaurantId, category.id, {
      name: 'Bhaji',
      description: null,
      priceMinor: 450,
      variants: [],
    });
    await expect(repo.deleteCategory(restaurantId, category.id)).rejects.toThrow();
    expect((await repo.listMenu(restaurantId)).categories).toHaveLength(1);
  });

  it('keeps variants with the item and scopes by restaurant', async () => {
    const category = await repo.createCategory(restaurantId, 'Mains');
    const item = await repo.createItem(restaurantId, category.id, {
      name: 'Biryani',
      description: 'Rice',
      priceMinor: 900,
      variants: [{ name: 'Large', priceMinor: 1400 }],
    });
    expect(await repo.deleteItem(randomUUID(), item!.id)).toBe(false);
    const menu = await repo.listMenu(restaurantId);
    const found = menu.categories.find((c) => c.id === category.id)!.items[0];
    expect(found.variants).toEqual([expect.objectContaining({ name: 'Large', priceMinor: 1400 })]);
  });
});
