import { describe, expect, it } from 'vitest';
import { InMemoryMenuItemRepository } from '../availability/in-memory-menu-item.repository';
import { item } from '../availability/test-helpers';
import { CartService } from './cart.service';

function setup(available = true) {
  const repo = new InMemoryMenuItemRepository([item('i1', 'r1', { available })]);
  return { repo, cart: new CartService(repo) };
}

describe('CartService', () => {
  it('refuses a sold-out item and leaves the cart unchanged (AC 3)', async () => {
    const { cart } = setup(false);
    await expect(cart.addItem('c1', 'i1', 1)).rejects.toMatchObject({
      status: 409,
      response: { code: 'ITEM_SOLD_OUT' },
    });
    expect((await cart.getCart('c1')).lines).toEqual([]);
  });

  it('keeps a sold-out line in the cart (AC 6)', async () => {
    const { cart, repo } = setup();
    await cart.addItem('c1', 'i1', 2);
    await repo.setAvailability('i1', false);
    const view = await cart.getCart('c1');
    expect(view.lines).toHaveLength(1);
    expect(view.lines[0]).toMatchObject({ itemId: 'i1', quantity: 2, available: false });
  });

  it('blocks checkout of an empty cart', async () => {
    const { cart } = setup();
    await expect(cart.checkout('nope')).rejects.toMatchObject({ status: 409, response: { code: 'CART_EMPTY' } });
  });

  it('blocks checkout while a line is sold out (AC 7)', async () => {
    const { cart, repo } = setup();
    await cart.addItem('c1', 'i1', 1);
    await repo.setAvailability('i1', false);
    await expect(cart.checkout('c1')).rejects.toMatchObject({
      status: 409,
      response: { code: 'CART_HAS_SOLD_OUT_ITEMS', itemIds: ['i1'] },
    });
    await repo.setAvailability('i1', true);
    await expect(cart.checkout('c1')).resolves.toEqual({ status: 'ready' });
  });
});
