import { Module } from '@nestjs/common';
import { DbModule } from './db/db.module';
import { HealthController } from './health/health.controller';
import { OpeningHoursModule } from './opening-hours/opening-hours.module';
import { OrdersModule } from './orders/orders.module';

@Module({ imports: [DbModule, OpeningHoursModule, OrdersModule], controllers: [HealthController] })
export class AppModule {}
