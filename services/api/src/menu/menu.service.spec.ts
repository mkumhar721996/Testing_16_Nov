import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { InMemoryMenuRepository } from './in-memory-menu.repository';
import { MenuService } from './menu.service';

const R1 = 'restaurant-1';
const R2 = 'restaurant-2';

describe('MenuService', () => {
  let service: MenuService;

  beforeEach(() => {
    service = new MenuService(new InMemoryMenuRepository());
  });

  const names = async (restaurantId = R1) =>
    (await service.getPartnerMenu(restaurantId)).categories.map((c) => c.name);

  it('AC1: a created category appears with its name; empty name refused', async () => {
    await service.createCategory(R1, ' Starters ');
    expect(await names()).toEqual(['Starters']);
    await expect(service.createCategory(R1, '   ')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('AC2: renaming shows the new name', async () => {
    const cat = await service.createCategory(R1, 'Starters');
    await service.renameCategory(R1, cat.id, 'Mains');
    expect(await names()).toEqual(['Mains']);
  });

  it('AC3: an empty category can be deleted', async () => {
    const cat = await service.createCategory(R1, 'Starters');
    await service.deleteCategory(R1, cat.id);
    expect((await service.getPartnerMenu(R1)).categories).toHaveLength(0);
  });

  it('AC4: an item with a name and price appears in its category', async () => {
    const cat = await service.createCategory(R1, 'Starters');
    await service.createItem(R1, cat.id, { name: 'Onion bhaji', priceMinor: 450, variants: [] });
    const menu = await service.getPartnerMenu(R1);
    expect(menu.categories[0].items[0]).toMatchObject({
      name: 'Onion bhaji',
      priceMinor: 450,
      variants: [],
    });
  });

  it('AC5: changing the price shows the new price', async () => {
    const cat = await service.createCategory(R1, 'Starters');
    const item = await service.createItem(R1, cat.id, {
      name: 'Onion bhaji',
      priceMinor: 450,
      variants: [],
    });
    await service.updateItem(R1, item.id, { name: 'Onion bhaji', priceMinor: 500, variants: [] });
    expect((await service.getPartnerMenu(R1)).categories[0].items[0].priceMinor).toBe(500);
  });

  it('AC6: a removed item no longer appears', async () => {
    const cat = await service.createCategory(R1, 'Starters');
    const item = await service.createItem(R1, cat.id, {
      name: 'Onion bhaji',
      priceMinor: 450,
      variants: [],
    });
    await service.deleteItem(R1, item.id);
    expect((await service.getPartnerMenu(R1)).categories[0].items).toEqual([]);
  });

  it('AC7: a size variant appears under the item with its price', async () => {
    const cat = await service.createCategory(R1, 'Mains');
    await service.createItem(R1, cat.id, {
      name: 'Biryani',
      priceMinor: 900,
      variants: [{ name: 'Large', priceMinor: 1400 }],
    });
    const items = (await service.getPartnerMenu(R1)).categories[0].items;
    expect(items[0].variants).toEqual([
      expect.objectContaining({ name: 'Large', priceMinor: 1400 }),
    ]);
  });

  describe('AC8: edits are live to customers with no further step', () => {
    it.each([
      [
        'category rename',
        async (s: MenuService, catId: string) => {
          await s.renameCategory(R1, catId, 'Renamed');
        },
        (m: Awaited<ReturnType<MenuService['getCustomerMenu']>>) => m.categories[0].name,
        'Renamed',
      ],
      [
        'item create',
        async (s: MenuService, catId: string) => {
          await s.createItem(R1, catId, { name: 'Dal', priceMinor: 600, variants: [] });
        },
        (m: Awaited<ReturnType<MenuService['getCustomerMenu']>>) => m.categories[0].items.at(-1)?.name,
        'Dal',
      ],
      [
        'price change',
        async (s: MenuService, catId: string) => {
          const first = (await s.getPartnerMenu(R1)).categories.find((c) => c.id === catId)!
            .items[0];
          await s.updateItem(R1, first.id, { name: first.name, priceMinor: 777, variants: [] });
        },
        (m: Awaited<ReturnType<MenuService['getCustomerMenu']>>) => m.categories[0].items[0].priceMinor,
        777,
      ],
    ])('%s', async (_label, edit, read, expected) => {
      const cat = await service.createCategory(R1, 'Starters');
      await service.createItem(R1, cat.id, { name: 'Bhaji', priceMinor: 450, variants: [] });
      await edit(service, cat.id);
      expect(read(await service.getCustomerMenu(R1))).toBe(expected);
    });

    it('the menu schema has no approval or status column', () => {
      const sql = readFileSync(join(__dirname, '../../db/migrations/0001_menu.sql'), 'utf8');
      expect(sql).not.toMatch(/approved|status/i);
    });
  });

  it('AC9 and AC12: customer sees the item with price and description; empty categories are omitted', async () => {
    const cat = await service.createCategory(R1, 'Starters');
    await service.createCategory(R1, 'Empty');
    await service.createItem(R1, cat.id, {
      name: 'Onion bhaji',
      priceMinor: 450,
      description: 'Crisp fried onion',
      variants: [],
    } as never);
    const customer = await service.getCustomerMenu(R1);
    expect(customer.categories).toHaveLength(1);
    expect(customer.categories[0].items[0]).toMatchObject({
      name: 'Onion bhaji',
      priceMinor: 450,
      description: 'Crisp fried onion',
    });
  });

  it('AC10: reordering changes the customer order', async () => {
    const ids: string[] = [];
    for (const name of ['A', 'B', 'C']) {
      const cat = await service.createCategory(R1, name);
      ids.push(cat.id);
      await service.createItem(R1, cat.id, { name: `${name} item`, priceMinor: 100, variants: [] });
    }
    await service.reorderCategories(R1, [ids[2], ids[0], ids[1]]);
    expect((await service.getCustomerMenu(R1)).categories.map((c) => c.name)).toEqual([
      'C',
      'A',
      'B',
    ]);
    await expect(service.reorderCategories(R1, [ids[2]])).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('AC11: a category with items cannot be deleted', async () => {
    const cat = await service.createCategory(R1, 'Starters');
    await service.createItem(R1, cat.id, { name: 'Bhaji', priceMinor: 450, variants: [] });
    await expect(service.deleteCategory(R1, cat.id)).rejects.toBeInstanceOf(ConflictException);
    expect((await service.getPartnerMenu(R1)).categories).toHaveLength(1);
  });

  it('AC13-15: invalid items are refused on create and update and are not stored', async () => {
    const cat = await service.createCategory(R1, 'Mains');
    const item = await service.createItem(R1, cat.id, { name: 'Soup', priceMinor: 300, variants: [] });
    const bad = [
      { name: 'Pizza', variants: [{ name: 'Large', priceMinor: 1400 }] },
      { name: '', priceMinor: 450, variants: [] },
      { name: 'Soup', priceMinor: 0, variants: [] },
    ];
    for (const input of bad) {
      await expect(service.createItem(R1, cat.id, input as never)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      await expect(service.updateItem(R1, item.id, input as never)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    }
    const items = (await service.getPartnerMenu(R1)).categories[0].items;
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ name: 'Soup', priceMinor: 300 });
  });

  it('keeps restaurants apart', async () => {
    const cat = await service.createCategory(R1, 'Starters');
    const item = await service.createItem(R1, cat.id, { name: 'Bhaji', priceMinor: 450, variants: [] });
    expect(await names(R2)).toEqual([]);
    await expect(service.deleteItem(R2, item.id)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.renameCategory(R2, cat.id, 'X')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.deleteCategory(R2, cat.id)).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.createItem(R2, cat.id, { name: 'Y', priceMinor: 1, variants: [] }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
