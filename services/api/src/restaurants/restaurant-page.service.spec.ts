import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryListingRepository } from './in-memory-listing.repository';
import { InMemoryMenuRepository } from './in-memory-menu.repository';
import type { MenuCategory, RestaurantSchedule } from './menu.types';
import { RestaurantPageService } from './restaurant-page.service';

const NOW = new Date('2026-11-20T19:00:00Z'); // Friday, 19:00 in London
const input = { name: 'Saffron & Spice', cuisine: 'Indian', addressCity: 'Leeds', description: 'Family-run' };
const schedule: RestaurantSchedule = {
  timezone: 'Europe/London',
  temporarilyClosed: false,
  slots: [{ weekday: 5, opens: '18:00', closes: '22:00' }],
};
const categories: MenuCategory[] = [
  {
    id: 'c1',
    name: 'Starters',
    items: [{ id: 'i1', name: 'Onion bhaji', description: '', price: 4.5, available: true, sizes: [] }],
  },
  {
    id: 'c2',
    name: 'Mains',
    items: [
      { id: 'i2', name: 'Chicken tikka masala', description: '', price: 12.5, available: false, sizes: [] },
      {
        id: 'i3',
        name: 'Lamb biryani',
        description: '',
        price: null,
        available: true,
        sizes: [
          { name: 'Regular', price: 9 },
          { name: 'Large', price: 12 },
        ],
      },
    ],
  },
];

describe('RestaurantPageService', () => {
  let listings: InMemoryListingRepository;
  let menu: InMemoryMenuRepository;
  let pages: RestaurantPageService;
  let approvedId: string;

  beforeEach(async () => {
    listings = new InMemoryListingRepository();
    menu = new InMemoryMenuRepository();
    pages = new RestaurantPageService(listings, menu);
    approvedId = (await listings.insert('p1', input)).id;
    await listings.setStatus(approvedId, 'pending', 'approved');
    menu.seed(approvedId, categories, schedule);
  });

  it('returns the approved restaurant page (AC 1)', async () => {
    expect(await pages.getPage(approvedId, NOW)).toMatchObject({ id: approvedId, name: 'Saffron & Spice' });
  });

  it('is not found for pending, rejected, unknown and malformed ids (AC 2)', async () => {
    const pending = (await listings.insert('p2', input)).id;
    const rejected = (await listings.insert('p3', input)).id;
    await listings.setStatus(rejected, 'pending', 'rejected');
    for (const id of [pending, rejected, 'not-a-uuid', '00000000-0000-0000-0000-000000000000']) {
      await expect(pages.getPage(id, NOW)).rejects.toBeInstanceOf(NotFoundException);
    }
  });

  it('nests items under their categories with prices, sizes and availability (AC 3 to 7)', async () => {
    const page = await pages.getPage(approvedId, NOW);
    expect(page.categories.map((c) => [c.name, c.items.map((i) => i.name)])).toEqual([
      ['Starters', ['Onion bhaji']],
      ['Mains', ['Chicken tikka masala', 'Lamb biryani']],
    ]);
    expect(page.categories[1].items[0]).toMatchObject({ price: 12.5, available: false });
    expect(page.categories[1].items[1].sizes).toEqual([
      { name: 'Regular', price: 9 },
      { name: 'Large', price: 12 },
    ]);
  });

  it('reports open, and closed when temporarily closed (AC 8, 9)', async () => {
    expect(await pages.getPage(approvedId, NOW)).toMatchObject({ isOpen: true, closesAt: '22:00', temporarilyClosed: false });
    menu.seed(approvedId, categories, { ...schedule, temporarilyClosed: true });
    expect(await pages.getPage(approvedId, NOW)).toMatchObject({ isOpen: false, temporarilyClosed: true });
  });

  it('returns no categories for a restaurant without a menu (AC 10)', async () => {
    menu.seed(approvedId, [], schedule);
    expect((await pages.getPage(approvedId, NOW)).categories).toEqual([]);
  });
});
