import { Module } from '@nestjs/common';
import { CLOCK, systemClock } from '../common/clock';
import { OpeningHoursModule } from '../opening-hours/opening-hours.module';
import { OrdersController } from './orders.controller';
import { ORDERS_REPOSITORY, PgOrdersRepository } from './orders.repository';
import { OrdersService } from './orders.service';

@Module({
  imports: [OpeningHoursModule],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    { provide: ORDERS_REPOSITORY, useClass: PgOrdersRepository },
    { provide: CLOCK, useValue: systemClock },
  ],
})
export class OrdersModule {}
