import { Module } from '@nestjs/common';
import pg from 'pg';
import { AdminListingsController } from './admin-listings.controller';
import { LISTING_REPOSITORY } from './listing.repository';
import { ListingService } from './listing.service';
import { PG_POOL, PgListingRepository } from './pg-listing.repository';
import { RestaurantsController } from './restaurants.controller';

@Module({
  controllers: [RestaurantsController, AdminListingsController],
  providers: [
    { provide: PG_POOL, useFactory: () => new pg.Pool({ connectionString: process.env.DATABASE_URL }) },
    { provide: LISTING_REPOSITORY, useClass: PgListingRepository },
    ListingService,
  ],
})
export class RestaurantsModule {}
