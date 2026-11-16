import { BadRequestException, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';
import { InMemoryMenuItemRepository } from './in-memory-menu-item.repository';
import { PartnerRestaurantGuard } from './partner-restaurant.guard';
import { item } from './test-helpers';

const ctx = (headers: Record<string, string>) =>
  ({ switchToHttp: () => ({ getRequest: () => ({ headers }) }) }) as unknown as ExecutionContext;

describe('AvailabilityController', () => {
  const controller = new AvailabilityController(
    new AvailabilityService(new InMemoryMenuItemRepository([item('i1', 'r1')])),
  );

  it('returns the updated item', async () => {
    expect(await controller.setAvailability('r1', 'i1', { available: false })).toMatchObject({ available: false });
  });

  it('rejects a non-boolean body with 400', () => {
    expect(() => controller.setAvailability('r1', 'i1', { available: 'no' })).toThrow(BadRequestException);
  });

  it('rejects a missing partner header with 401', () => {
    const guard = new PartnerRestaurantGuard();
    expect(() => guard.canActivate(ctx({}))).toThrow(UnauthorizedException);
    expect(guard.canActivate(ctx({ 'x-partner-restaurant-id': 'r1' }))).toBe(true);
  });

  it('refuses the header stand-in in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    try {
      expect(() => new PartnerRestaurantGuard().canActivate(ctx({ 'x-partner-restaurant-id': 'r1' }))).toThrow(
        ForbiddenException,
      );
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
