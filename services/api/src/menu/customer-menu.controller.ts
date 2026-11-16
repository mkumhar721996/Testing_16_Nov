import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { MenuService } from './menu.service';

/** Public by design: customers browse menus without signing in. */
@Controller('restaurants/:restaurantId/menu')
export class CustomerMenuController {
  constructor(private readonly menu: MenuService) {}

  @Get()
  getMenu(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.menu.getCustomerMenu(restaurantId);
  }
}
