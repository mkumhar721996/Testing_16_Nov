import { Controller, Get, HttpCode, Inject, Param, Post, UseGuards } from '@nestjs/common';
import type { Actor } from '../auth/actor';
import { ActorGuard, CurrentActor } from '../auth/actor.guard';
import { ListingService } from './listing.service';
import { toView, type ListingView } from './listing.view';

@Controller('admin/restaurant-listings')
@UseGuards(ActorGuard)
export class AdminListingsController {
  constructor(@Inject(ListingService) private readonly listings: ListingService) {}

  /** The moderation queue: pending listings only. */
  @Get()
  async pending(@CurrentActor() actor: Actor | null): Promise<ListingView[]> {
    return (await this.listings.listPending(actor)).map(toView);
  }

  @Post(':id/approve')
  @HttpCode(200)
  async approve(@CurrentActor() actor: Actor | null, @Param('id') id: string): Promise<ListingView> {
    return toView(await this.listings.approve(actor, id));
  }

  @Post(':id/reject')
  @HttpCode(200)
  async reject(@CurrentActor() actor: Actor | null, @Param('id') id: string): Promise<ListingView> {
    return toView(await this.listings.reject(actor, id));
  }
}
