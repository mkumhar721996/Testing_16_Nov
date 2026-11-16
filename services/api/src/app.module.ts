import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { MenuModule } from './menu/menu.module';

@Module({ imports: [MenuModule], controllers: [HealthController] })
export class AppModule {}
