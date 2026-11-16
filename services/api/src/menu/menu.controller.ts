import { Controller, Get, Inject, Param } from '@nestjs/common';
import type { MenuItem } from '../availability/menu-item';
import { MenuService } from './menu.service';

@Controller('restaurants/:restaurantId/menu')
export class MenuController {
  constructor(@Inject(MenuService) private readonly service: MenuService) {}

  @Get()
  get(@Param('restaurantId') restaurantId: string): Promise<MenuItem[]> {
    return this.service.getMenu(restaurantId);
  }
}
