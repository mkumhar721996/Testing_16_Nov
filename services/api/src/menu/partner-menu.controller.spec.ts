import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NotFoundException, UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { InMemoryMenuRepository } from './in-memory-menu.repository';
import { CustomerMenuController } from './customer-menu.controller';
import { MenuService } from './menu.service';
import { PartnerMenuController } from './partner-menu.controller';
import { DevStubRestaurantResolver, PartnerRestaurantGuard } from './partner-restaurant.guard';

const R1 = '11111111-1111-4111-8111-111111111111';
const R2 = '22222222-2222-4222-8222-222222222222';

describe('menu controllers', () => {
  let partner: PartnerMenuController;
  let customer: CustomerMenuController;

  beforeEach(() => {
    const service = new MenuService(new InMemoryMenuRepository());
    partner = new PartnerMenuController(service);
    customer = new CustomerMenuController(service);
  });

  it('a category of one restaurant is not returned for another', async () => {
    await partner.createCategory(R1, { name: 'Starters' });
    expect((await partner.getMenu(R1)).categories).toHaveLength(1);
    expect((await partner.getMenu(R2)).categories).toHaveLength(0);
  });

  it('another restaurant cannot delete an item', async () => {
    const cat = await partner.createCategory(R1, { name: 'Starters' });
    const item = await partner.createItem(R1, cat.id, {
      name: 'Bhaji',
      priceMinor: 450,
      variants: [],
    });
    await expect(partner.deleteItem(R2, item.id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('customers read the saved menu without any sign-in', async () => {
    const cat = await partner.createCategory(R1, { name: 'Starters' });
    await partner.createItem(R1, cat.id, { name: 'Bhaji', priceMinor: 450, variants: [] });
    const menu = await customer.getMenu(R1);
    expect(menu.categories[0].items[0]).toMatchObject({ name: 'Bhaji', priceMinor: 450 });
  });
});

describe('PartnerRestaurantGuard', () => {
  const contextFor = (headers: Record<string, string>) => {
    const request: { headers: Record<string, string>; restaurantId?: string } = { headers };
    const context = { switchToHttp: () => ({ getRequest: () => request }) } as ExecutionContext;
    return { request, context };
  };

  afterEach(() => {
    delete process.env.PARTNER_AUTH_STUB;
  });

  it('refuses when the development stub is off', async () => {
    const guard = new PartnerRestaurantGuard(new DevStubRestaurantResolver());
    const { context } = contextFor({ 'x-restaurant-id': R1 });
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('attaches the restaurant id when the stub is on', async () => {
    process.env.PARTNER_AUTH_STUB = '1';
    const guard = new PartnerRestaurantGuard(new DevStubRestaurantResolver());
    const { context, request } = contextFor({ 'x-restaurant-id': R1 });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.restaurantId).toBe(R1);
  });

  it('refuses a missing or malformed id even when the stub is on', async () => {
    process.env.PARTNER_AUTH_STUB = '1';
    const guard = new PartnerRestaurantGuard(new DevStubRestaurantResolver());
    await expect(guard.canActivate(contextFor({}).context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(
      guard.canActivate(contextFor({ 'x-restaurant-id': 'nope' }).context),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
