import { expect, test } from '@playwright/test';

const r1 = { 'x-partner-restaurant-id': 'r1' };
const r2 = { 'x-partner-restaurant-id': 'r2' };

test('sold-out journey', async ({ request }) => {
  const sold = await request.patch('/partner/items/onion-bhaji/availability', { headers: r1, data: { available: false } });
  expect(sold.ok()).toBeTruthy();

  const menu = await (await request.get('/restaurants/r1/menu')).json();
  expect(menu.find((i: { id: string }) => i.id === 'onion-bhaji').available).toBe(false);
  expect(menu.find((i: { id: string }) => i.id === 'samosa').available).toBe(true);

  const add = await request.post('/carts/c1/items', { data: { itemId: 'onion-bhaji', quantity: 1 } });
  expect(add.status()).toBe(409);

  const refused = await request.patch('/partner/items/onion-bhaji/availability', { headers: r2, data: { available: true } });
  expect(refused.status()).toBe(403);

  await request.patch('/partner/items/onion-bhaji/availability', { headers: r1, data: { available: true } });
  const again = await request.post('/carts/c1/items', { data: { itemId: 'onion-bhaji', quantity: 1 } });
  expect(again.status()).toBe(201);
  await request.patch('/partner/items/onion-bhaji/availability', { headers: r1, data: { available: false } });
  expect((await request.get('/carts/c1')).status()).toBe(200);
  expect((await request.post('/carts/c1/checkout')).status()).toBe(409);
});
