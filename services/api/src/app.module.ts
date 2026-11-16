import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { RestaurantsModule } from './restaurants/restaurants.module';

@Module({ imports: [RestaurantsModule], controllers: [HealthController] })
export class AppModule {}
