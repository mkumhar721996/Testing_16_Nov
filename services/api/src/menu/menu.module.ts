import { Logger, Module } from '@nestjs/common';
import { CustomerMenuController } from './customer-menu.controller';
import { MENU_REPOSITORY } from './menu.repository';
import { MenuService } from './menu.service';
import { PartnerMenuController } from './partner-menu.controller';
import {
  DevStubRestaurantResolver,
  PARTNER_RESTAURANT_RESOLVER,
  PartnerRestaurantGuard,
} from './partner-restaurant.guard';
import { PgMenuRepository, createPool } from './pg-menu.repository';

@Module({
  controllers: [PartnerMenuController, CustomerMenuController],
  providers: [
    MenuService,
    PartnerRestaurantGuard,
    { provide: PARTNER_RESTAURANT_RESOLVER, useClass: DevStubRestaurantResolver },
    {
      provide: MENU_REPOSITORY,
      useFactory: () => {
        if (!process.env.DATABASE_URL) {
          new Logger(MenuModule.name).warn('DATABASE_URL is not set; menu requests will fail');
        }
        return new PgMenuRepository(createPool());
      },
    },
  ],
})
export class MenuModule {}
