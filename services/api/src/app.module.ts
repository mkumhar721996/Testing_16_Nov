import { Module } from '@nestjs/common';
import { AvailabilityModule } from './availability/availability.module';
import { CartModule } from './cart/cart.module';
import { HealthController } from './health/health.controller';
import { MenuModule } from './menu/menu.module';

@Module({ imports: [AvailabilityModule, MenuModule, CartModule], controllers: [HealthController] })
export class AppModule {}
