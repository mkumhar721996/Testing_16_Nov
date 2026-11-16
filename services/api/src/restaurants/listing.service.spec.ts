import { BadRequestException, ConflictException, ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Actor } from '../auth/actor';
import { InMemoryListingRepository } from './in-memory-listing.repository';
import { ListingService } from './listing.service';
import type { ListingInput } from './listing.types';

const partner: Actor = { id: 'p1', role: 'partner' };
const admin: Actor = { id: 'a1', role: 'admin' };
const customer: Actor = { id: 'c1', role: 'customer' };
const input: ListingInput = {
  name: 'Saffron & Spice',
  cuisine: 'Indian',
  addressCity: '12 High Street, Leeds',
  description: 'Family-run kitchen',
};
const fields = ['name', 'cuisine', 'addressCity', 'description'] as const;

describe('ListingService', () => {
  let repo: InMemoryListingRepository;
  let svc: ListingService;

  beforeEach(() => {
    repo = new InMemoryListingRepository();
    svc = new ListingService(repo);
  });

  it('creates a pending listing (AC 1)', async () => {
    const created = await svc.create(partner, input);
    expect(created.id).toBeTruthy();
    expect(created.status).toBe('pending');
  });

  it('shows the entered fields to the partner (AC 2)', async () => {
    await svc.create(partner, input);
    expect(await svc.getMine(partner)).toMatchObject(input);
  });

  it('getMine is 404 when there is no listing', async () => {
    await expect(svc.getMine(partner)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('hides a pending listing from customers (AC 3)', async () => {
    await svc.create(partner, input);
    expect(await svc.listVisibleToCustomers()).toEqual([]);
  });

  it('approve shows the restaurant to customers (AC 4)', async () => {
    const created = await svc.create(partner, input);
    const approved = await svc.approve(admin, created.id);
    expect(approved.status).toBe('approved');
    expect((await svc.listVisibleToCustomers()).map((l) => l.id)).toEqual([created.id]);
  });

  it('reject keeps the restaurant hidden (AC 5)', async () => {
    const created = await svc.create(partner, input);
    const rejected = await svc.reject(admin, created.id);
    expect(rejected.status).toBe('rejected');
    expect(await svc.listVisibleToCustomers()).toEqual([]);
  });

  it('refuses create from non-partners (AC 6)', async () => {
    await expect(svc.create(customer, input)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(svc.create(admin, input)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(svc.create(null, input)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(await repo.findByOwner('c1')).toBeNull();
  });

  it('refuses approve from non-admins (AC 7)', async () => {
    const created = await svc.create(partner, input);
    await expect(svc.approve(partner, created.id)).rejects.toBeInstanceOf(ForbiddenException);
    expect((await repo.findById(created.id))!.status).toBe('pending');
  });

  it('refuses reject from non-admins (AC 8)', async () => {
    const created = await svc.create(partner, input);
    await expect(svc.reject(partner, created.id)).rejects.toBeInstanceOf(ForbiddenException);
    expect((await repo.findById(created.id))!.status).toBe('pending');
  });

  it('refuses the pending queue to non-admins', async () => {
    await expect(svc.listPending(partner)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it.each(fields)('editing %s of an approved listing sends it to pending and hides it (AC 9, 10)', async (field) => {
    const created = await svc.create(partner, input);
    await svc.approve(admin, created.id);
    const edited = await svc.updateMine(partner, { ...input, [field]: 'Changed' });
    expect(edited.status).toBe('pending');
    expect((await svc.getMine(partner)).status).toBe('pending');
    expect(await svc.listVisibleToCustomers()).toEqual([]);
  });

  it('shows a changed name (AC 11)', async () => {
    await svc.create(partner, input);
    await svc.updateMine(partner, { ...input, name: 'Saffron & Spice Kitchen' });
    expect((await svc.getMine(partner)).name).toBe('Saffron & Spice Kitchen');
  });

  it('refuses a second listing (AC 12)', async () => {
    await svc.create(partner, input);
    await expect(svc.create(partner, input)).rejects.toBeInstanceOf(ConflictException);
  });

  it('shows rejected status to the partner (AC 13)', async () => {
    const created = await svc.create(partner, input);
    await svc.reject(admin, created.id);
    expect((await svc.getMine(partner)).status).toBe('rejected');
  });

  it('resubmits a rejected listing as pending (AC 14)', async () => {
    const created = await svc.create(partner, input);
    await svc.reject(admin, created.id);
    const resubmitted = await svc.updateMine(partner, { ...input, description: 'Updated' });
    expect(resubmitted.status).toBe('pending');
    expect((await svc.listPending(admin)).map((l) => l.id)).toContain(created.id);
  });

  it.each(fields)('refuses create with empty %s (AC 15)', async (field) => {
    await expect(svc.create(partner, { ...input, [field]: '   ' })).rejects.toBeInstanceOf(BadRequestException);
    expect(await repo.findByOwner('p1')).toBeNull();
  });

  it('refuses an edit that blanks a field', async () => {
    await svc.create(partner, input);
    await expect(svc.updateMine(partner, { ...input, name: '' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses to decide an already-decided or unknown listing', async () => {
    const created = await svc.create(partner, input);
    await svc.approve(admin, created.id);
    await expect(svc.reject(admin, created.id)).rejects.toBeInstanceOf(ConflictException);
    await expect(svc.approve(admin, 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
