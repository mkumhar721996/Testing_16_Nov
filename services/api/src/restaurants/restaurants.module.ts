import { Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import pg from 'pg';
import { AdminListingsController } from './admin-listings.controller';
import { LISTING_REPOSITORY } from './listing.repository';
import { ListingService } from './listing.service';
import { MENU_REPOSITORY } from './menu.repository';
import { PG_POOL, PgListingRepository } from './pg-listing.repository';
import { PgMenuRepository } from './pg-menu.repository';
import { RestaurantPageService } from './restaurant-page.service';
import { RestaurantsController } from './restaurants.controller';

@Module({
  controllers: [RestaurantsController, AdminListingsController],
  providers: [
    {
      provide: PG_POOL,
      useFactory: () => {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) throw new Error('DATABASE_URL is required');
        return new pg.Pool({ connectionString });
      },
    },
    { provide: LISTING_REPOSITORY, useClass: PgListingRepository },
    { provide: MENU_REPOSITORY, useClass: PgMenuRepository },
    ListingService,
    RestaurantPageService,
  ],
})
export class RestaurantsModule implements OnApplicationShutdown {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}
