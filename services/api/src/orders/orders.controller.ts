import { Controller, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { CustomerGuard } from '../auth/customer.guard';
import { OrdersService } from './orders.service';
import type { PlacedOrder } from './orders.repository';

@Controller('restaurants/:restaurantId/orders')
@UseGuards(CustomerGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  place(@Param('restaurantId', new ParseUUIDPipe()) restaurantId: string): Promise<PlacedOrder> {
    return this.orders.placeOrder(restaurantId);
  }
}
