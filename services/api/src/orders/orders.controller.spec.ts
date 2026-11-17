import { BadRequestException, ParseUUIDPipe, type ArgumentMetadata } from '@nestjs/common';
import { GUARDS_METADATA, ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { describe, expect, it } from 'vitest';
import { CustomerGuard } from '../auth/customer.guard';
import { OrdersController } from './orders.controller';

describe('OrdersController', () => {
  it('is guarded by the customer check', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, OrdersController)).toContain(CustomerGuard);
  });

  it('declares a ParseUUIDPipe on the restaurant id', () => {
    const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, OrdersController, 'place') as Record<string, { pipes: unknown[] }>;
    expect(Object.values(args)[0].pipes.some((p) => p instanceof ParseUUIDPipe)).toBe(true);
  });

  it('rejects a malformed restaurant id with 400 rather than reaching the database', async () => {
    const meta: ArgumentMetadata = { type: 'param', data: 'restaurantId' };
    await expect(new ParseUUIDPipe().transform('not-a-uuid', meta)).rejects.toBeInstanceOf(BadRequestException);
  });
});
