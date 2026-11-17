import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OpeningHoursController } from './opening-hours.controller';
import { OPENING_HOURS_REPOSITORY, PgOpeningHoursRepository } from './opening-hours.repository';
import { OpeningHoursService } from './opening-hours.service';

@Module({
  imports: [AuthModule],
  controllers: [OpeningHoursController],
  providers: [OpeningHoursService, { provide: OPENING_HOURS_REPOSITORY, useClass: PgOpeningHoursRepository }],
  exports: [OPENING_HOURS_REPOSITORY],
})
export class OpeningHoursModule {}
