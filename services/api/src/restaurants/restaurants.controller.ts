import { Body, Controller, Get, HttpCode, Inject, Post, Put, UseGuards } from '@nestjs/common';
import type { Actor } from '../auth/actor';
import { ActorGuard, CurrentActor } from '../auth/actor.guard';
import { ListingService } from './listing.service';
import type { ListingInput } from './listing.types';
import { toView, type ListingView } from './listing.view';

@Controller()
@UseGuards(ActorGuard)
export class RestaurantsController {
  constructor(@Inject(ListingService) private readonly listings: ListingService) {}

  @Post('restaurant-listings')
  async create(@CurrentActor() actor: Actor | null, @Body() body: ListingInput): Promise<ListingView> {
    return toView(await this.listings.create(actor, body));
  }

  @Get('restaurant-listings/mine')
  async mine(@CurrentActor() actor: Actor | null): Promise<ListingView> {
    return toView(await this.listings.getMine(actor));
  }

  @Put('restaurant-listings/mine')
  async updateMine(@CurrentActor() actor: Actor | null, @Body() body: ListingInput): Promise<ListingView> {
    return toView(await this.listings.updateMine(actor, body));
  }

  /** Customer-visible restaurants: approved listings only. */
  @Get('restaurants')
  @HttpCode(200)
  async visible(): Promise<Omit<ListingView, 'status'>[]> {
    return (await this.listings.listVisibleToCustomers()).map(({ id, name, cuisine, addressCity, description }) => ({
      id,
      name,
      cuisine,
      addressCity,
      description,
    }));
  }
}
