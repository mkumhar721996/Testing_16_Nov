import { Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import pg from 'pg';
import { AdminListingsController } from './admin-listings.controller';
import { LISTING_REPOSITORY } from './listing.repository';
import { ListingService } from './listing.service';
import { PG_POOL, PgListingRepository } from './pg-listing.repository';
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
    ListingService,
  ],
})
export class RestaurantsModule implements OnApplicationShutdown {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}
