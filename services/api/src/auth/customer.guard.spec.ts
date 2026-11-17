import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { CustomerGuard } from './customer.guard';
import type { Principal } from './partner.guard';

const context = { switchToHttp: () => ({ getRequest: () => ({}) }) } as unknown as ExecutionContext;
const guardFor = (principal: Principal | null) => new CustomerGuard({ resolve: async () => principal });

describe('CustomerGuard', () => {
  it('answers 401 when nobody is signed in', async () => {
    await expect(guardFor(null).canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('answers 403 for a partner', async () => {
    const partner: Principal = { role: 'partner', tenantId: 't', restaurantId: 'r' };
    await expect(guardFor(partner).canActivate(context)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lets a customer through', async () => {
    await expect(guardFor({ role: 'customer', tenantId: 't' }).canActivate(context)).resolves.toBe(true);
  });
});
