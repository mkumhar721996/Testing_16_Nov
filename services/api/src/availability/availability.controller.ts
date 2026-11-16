import { BadRequestException, Body, Controller, Get, Headers, Inject, Param, Patch, UseGuards } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import type { MenuItem } from './menu-item';
import { PARTNER_RESTAURANT_HEADER, PartnerRestaurantGuard } from './partner-restaurant.guard';

@Controller('partner/items')
@UseGuards(PartnerRestaurantGuard)
export class AvailabilityController {
  constructor(@Inject(AvailabilityService) private readonly service: AvailabilityService) {}

  @Get()
  list(@Headers(PARTNER_RESTAURANT_HEADER) restaurantId: string): Promise<MenuItem[]> {
    return this.service.listItems(restaurantId);
  }

  @Patch(':itemId/availability')
  setAvailability(
    @Headers(PARTNER_RESTAURANT_HEADER) restaurantId: string,
    @Param('itemId') itemId: string,
    @Body() body: { available?: unknown },
  ): Promise<MenuItem> {
    if (typeof body?.available !== 'boolean') throw new BadRequestException('available must be true or false');
    return this.service.setAvailability(restaurantId, itemId, body.available);
  }
}
