import { Global, Module } from '@nestjs/common';
import { Pool } from 'pg';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';
import { DEV_MENU_ITEMS } from './dev-seed';
import { InMemoryMenuItemRepository } from './in-memory-menu-item.repository';
import { MENU_ITEM_REPOSITORY } from './menu-item.repository';
import { PgMenuItemRepository } from './pg-menu-item.repository';

// Postgres when DATABASE_URL is set; otherwise in-memory (development and e2e).
@Global()
@Module({
  controllers: [AvailabilityController],
  providers: [
    AvailabilityService,
    {
      provide: MENU_ITEM_REPOSITORY,
      useFactory: () => {
        if (process.env.DATABASE_URL) {
          return new PgMenuItemRepository(new Pool({ connectionString: process.env.DATABASE_URL }));
        }
        if (process.env.NODE_ENV === 'production') {
          throw new Error('DATABASE_URL is required in production');
        }
        return new InMemoryMenuItemRepository(DEV_MENU_ITEMS);
      },
    },
  ],
  exports: [MENU_ITEM_REPOSITORY],
})
export class AvailabilityModule {}
