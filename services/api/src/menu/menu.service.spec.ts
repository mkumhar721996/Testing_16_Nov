import { describe, expect, it } from 'vitest';
import { InMemoryMenuItemRepository } from '../availability/in-memory-menu-item.repository';
import { item } from '../availability/test-helpers';
import { MenuService } from './menu.service';

describe('MenuService', () => {
  it('lists sold-out items as unavailable (AC 2)', async () => {
    const repo = new InMemoryMenuItemRepository([item('i1', 'r1', { available: false }), item('i2', 'r1')]);
    const menu = await new MenuService(repo).getMenu('r1');
    expect(menu).toHaveLength(2);
    expect(menu.find((i) => i.id === 'i1')).toMatchObject({ available: false });
  });
});
