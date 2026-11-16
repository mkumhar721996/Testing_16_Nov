import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MenuService } from '../menu/menu.service';
import { AvailabilityService } from './availability.service';
import { InMemoryMenuItemRepository } from './in-memory-menu-item.repository';
import { item } from './test-helpers';

describe('AvailabilityService', () => {
  afterEach(() => vi.useRealTimers());

  it('marks an item sold out and available again (AC 1)', async () => {
    const repo = new InMemoryMenuItemRepository([item('i1', 'r1')]);
    const svc = new AvailabilityService(repo);
    await svc.setAvailability('r1', 'i1', false);
    expect((await repo.findById('i1'))!.available).toBe(false);
    await svc.setAvailability('r1', 'i1', true);
    expect((await repo.findById('i1'))!.available).toBe(true);
  });

  it('leaves other items untouched (AC 4)', async () => {
    const repo = new InMemoryMenuItemRepository([item('A', 'r1'), item('B', 'r1')]);
    await new AvailabilityService(repo).setAvailability('r1', 'A', false);
    expect((await repo.findById('B'))!.available).toBe(true);
    expect((await new MenuService(repo).getMenu('r1')).find((i) => i.id === 'B')!.available).toBe(true);
  });

  it('stays sold out as time passes (AC 5)', async () => {
    vi.useFakeTimers();
    const repo = new InMemoryMenuItemRepository([item('i1', 'r1')]);
    await new AvailabilityService(repo).setAvailability('r1', 'i1', false);
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(7 * 24 * 3600 * 1000);
    expect((await new MenuService(repo).getMenu('r1'))[0].available).toBe(false);
  });

  it("refuses another restaurant's item (AC 8)", async () => {
    const repo = new InMemoryMenuItemRepository([item('other-item', 'r2')]);
    await expect(new AvailabilityService(repo).setAvailability('r1', 'other-item', false)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect((await repo.findById('other-item'))!.available).toBe(true);
  });

  it('rejects an unknown item', async () => {
    const svc = new AvailabilityService(new InMemoryMenuItemRepository([]));
    await expect(svc.setAvailability('r1', 'nope', false)).rejects.toBeInstanceOf(NotFoundException);
  });
});
