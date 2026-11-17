import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Clock } from '../common/clock';
import { WEEKDAYS, type WeekHours } from '../opening-hours/opening-hours.domain';
import { OpeningHoursService } from '../opening-hours/opening-hours.service';
import { InMemoryStore } from '../testing/in-memory-store';
import { OrdersService } from './orders.service';

const rid = 'restaurant-1';

function eveningWeek(): WeekHours {
  const week = {} as WeekHours;
  for (const day of WEEKDAYS) week[day] = [{ opensAt: '18:00', closesAt: '22:00' }];
  return week;
}

describe('OrdersService', () => {
  let store: InMemoryStore;
  let instant: Date;
  let orders: OrdersService;
  let hours: OpeningHoursService;

  const clock: Clock = { now: () => instant };

  beforeEach(() => {
    store = new InMemoryStore();
    store.addRestaurant(rid, { hours: eveningWeek() });
    // Tuesday 18:30 in Bogota (UTC-5).
    instant = new Date('2026-11-17T23:30:00Z');
    orders = new OrdersService(store, store, clock);
    hours = new OpeningHoursService(store);
  });

  it('accepts an order inside a slot (AC 5, 7)', async () => {
    await expect(orders.placeOrder(rid)).resolves.toMatchObject({ status: 'placed' });
    expect(store.orders).toHaveLength(1);
  });

  it('refuses an order while temporarily closed (AC 4)', async () => {
    await hours.setTemporarilyClosed(rid, true);
    await expect(orders.placeOrder(rid)).rejects.toMatchObject({ response: { code: 'TEMPORARILY_CLOSED' }, status: 409 });
    expect(store.orders).toHaveLength(0);
  });

  it('refuses an order immediately after the partner closes (AC 3)', async () => {
    await expect(orders.placeOrder(rid)).resolves.toMatchObject({ status: 'placed' });
    await hours.setTemporarilyClosed(rid, true);
    await expect(orders.placeOrder(rid)).rejects.toMatchObject({ response: { code: 'TEMPORARILY_CLOSED' } });
  });

  it('refuses an order outside every slot (AC 6)', async () => {
    instant = new Date('2026-11-17T20:00:00Z'); // 15:00 local
    await expect(orders.placeOrder(rid)).rejects.toMatchObject({ response: { code: 'OUTSIDE_OPENING_HOURS' }, status: 409 });
    expect(store.orders).toHaveLength(0);
  });

  it('refuses an order at the closing time 22:00 local (AC 8)', async () => {
    instant = new Date('2026-11-18T03:00:00Z');
    await expect(orders.placeOrder(rid)).rejects.toMatchObject({ response: { code: 'OUTSIDE_OPENING_HOURS' } });
  });

  it('refuses a restaurant that has no hours saved', async () => {
    store.addRestaurant('new');
    await expect(orders.placeOrder('new')).rejects.toMatchObject({ response: { code: 'OUTSIDE_OPENING_HOURS' } });
  });

  it('keeps an already placed order when the restaurant closes (AC 10)', async () => {
    const placed = await orders.placeOrder(rid);
    await hours.setTemporarilyClosed(rid, true);
    expect(store.orders.find((o) => o.id === placed.id)?.status).toBe('placed');
  });

  it('reports an unknown restaurant as not found', async () => {
    await expect(orders.placeOrder('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
