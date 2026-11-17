import { Controller, Param, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';
import type { PlacedOrder } from './orders.repository';

@Controller('restaurants/:restaurantId/orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  place(@Param('restaurantId') restaurantId: string): Promise<PlacedOrder> {
    return this.orders.placeOrder(restaurantId);
  }
}
