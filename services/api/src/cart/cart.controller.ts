import { BadRequestException, Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { CartService, type CartLineView } from './cart.service';

@Controller('carts/:cartId')
export class CartController {
  constructor(@Inject(CartService) private readonly service: CartService) {}

  @Post('items')
  addItem(
    @Param('cartId') cartId: string,
    @Body() body: { itemId?: unknown; quantity?: unknown },
  ): Promise<{ lines: CartLineView[] }> {
    if (typeof body?.itemId !== 'string' || !Number.isInteger(body.quantity) || (body.quantity as number) < 1) {
      throw new BadRequestException('itemId and a positive whole quantity are required');
    }
    return this.service.addItem(cartId, body.itemId, body.quantity as number);
  }

  @Get()
  get(@Param('cartId') cartId: string): Promise<{ lines: CartLineView[] }> {
    return this.service.getCart(cartId);
  }

  @Post('checkout')
  checkout(@Param('cartId') cartId: string): Promise<{ status: 'ready' }> {
    return this.service.checkout(cartId);
  }
}
