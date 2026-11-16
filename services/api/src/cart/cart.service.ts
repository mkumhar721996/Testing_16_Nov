import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MENU_ITEM_REPOSITORY, type MenuItemRepository } from '../availability/menu-item.repository';

interface CartLine {
  itemId: string;
  quantity: number;
}

export interface CartLineView extends CartLine {
  name: string;
  available: boolean;
}

// Minimal in-memory cart; the Cart and Checkout story replaces it.
@Injectable()
export class CartService {
  private readonly carts = new Map<string, CartLine[]>();

  constructor(@Inject(MENU_ITEM_REPOSITORY) private readonly repo: MenuItemRepository) {}

  async addItem(cartId: string, itemId: string, quantity: number): Promise<{ lines: CartLineView[] }> {
    const item = await this.repo.findById(itemId);
    if (!item) throw new NotFoundException(`Item ${itemId} not found`);
    if (!item.available) throw new ConflictException({ code: 'ITEM_SOLD_OUT', itemId });
    const lines = this.carts.get(cartId) ?? [];
    const existing = lines.find((l) => l.itemId === itemId);
    if (existing) existing.quantity += quantity;
    else lines.push({ itemId, quantity });
    this.carts.set(cartId, lines);
    return this.getCart(cartId);
  }

  // Availability is looked up live, never stored on the line.
  async getCart(cartId: string): Promise<{ lines: CartLineView[] }> {
    const lines = await Promise.all(
      (this.carts.get(cartId) ?? []).map(async (line) => {
        const item = await this.repo.findById(line.itemId);
        return { ...line, name: item?.name ?? line.itemId, available: item?.available ?? false };
      }),
    );
    return { lines };
  }

  async checkout(cartId: string): Promise<{ status: 'ready' }> {
    const soldOut = (await this.getCart(cartId)).lines.filter((l) => !l.available).map((l) => l.itemId);
    if (soldOut.length > 0) throw new ConflictException({ code: 'CART_HAS_SOLD_OUT_ITEMS', itemIds: soldOut });
    return { status: 'ready' };
  }
}
