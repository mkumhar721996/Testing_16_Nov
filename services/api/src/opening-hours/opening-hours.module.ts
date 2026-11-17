import { Module } from '@nestjs/common';
import { PartnerGuard, PRINCIPAL_RESOLVER } from '../auth/partner.guard';
import { OpeningHoursController } from './opening-hours.controller';
import { OPENING_HOURS_REPOSITORY, PgOpeningHoursRepository } from './opening-hours.repository';
import { OpeningHoursService } from './opening-hours.service';

@Module({
  controllers: [OpeningHoursController],
  providers: [
    OpeningHoursService,
    PartnerGuard,
    { provide: OPENING_HOURS_REPOSITORY, useClass: PgOpeningHoursRepository },
    // Stand-in until the Entra ID sign-in (ADR-0008) exists: nobody is signed in, so every partner call is a 401.
    { provide: PRINCIPAL_RESOLVER, useValue: { resolve: async () => null } },
  ],
  exports: [OPENING_HOURS_REPOSITORY],
})
export class OpeningHoursModule {}
