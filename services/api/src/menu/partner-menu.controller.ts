import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { PartnerRestaurantGuard, RestaurantId } from './partner-restaurant.guard';

@Controller('partner/menu')
@UseGuards(PartnerRestaurantGuard)
export class PartnerMenuController {
  constructor(private readonly menu: MenuService) {}

  @Get()
  getMenu(@RestaurantId() restaurantId: string) {
    return this.menu.getPartnerMenu(restaurantId);
  }

  @Post('categories')
  createCategory(@RestaurantId() restaurantId: string, @Body() body: { name?: unknown }) {
    return this.menu.createCategory(restaurantId, body?.name);
  }

  @Put('categories/order')
  @HttpCode(204)
  reorderCategories(
    @RestaurantId() restaurantId: string,
    @Body() body: { categoryIds?: unknown },
  ) {
    return this.menu.reorderCategories(restaurantId, body?.categoryIds);
  }

  @Patch('categories/:id')
  @HttpCode(204)
  renameCategory(
    @RestaurantId() restaurantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { name?: unknown },
  ) {
    return this.menu.renameCategory(restaurantId, id, body?.name);
  }

  @Delete('categories/:id')
  @HttpCode(204)
  deleteCategory(@RestaurantId() restaurantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.menu.deleteCategory(restaurantId, id);
  }

  @Post('categories/:id/items')
  createItem(
    @RestaurantId() restaurantId: string,
    @Param('id', ParseUUIDPipe) categoryId: string,
    @Body() body: unknown,
  ) {
    return this.menu.createItem(restaurantId, categoryId, body);
  }

  @Put('items/:id')
  updateItem(
    @RestaurantId() restaurantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    return this.menu.updateItem(restaurantId, id, body);
  }

  @Delete('items/:id')
  @HttpCode(204)
  deleteItem(@RestaurantId() restaurantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.menu.deleteItem(restaurantId, id);
  }
}
