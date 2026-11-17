import { Module } from '@nestjs/common';
import { CustomerGuard } from './customer.guard';
import { PartnerGuard, PRINCIPAL_RESOLVER } from './partner.guard';

@Module({
  providers: [
    PartnerGuard,
    CustomerGuard,
    // Stand-in until the Entra ID sign-in (ADR-0008) exists: nobody is signed in, so every guarded call is a 401.
    { provide: PRINCIPAL_RESOLVER, useValue: { resolve: async () => null } },
  ],
  exports: [PartnerGuard, CustomerGuard, PRINCIPAL_RESOLVER],
})
export class AuthModule {}
