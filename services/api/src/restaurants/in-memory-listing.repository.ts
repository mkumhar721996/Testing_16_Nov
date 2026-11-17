import { randomUUID } from 'node:crypto';
import { DuplicateOwnerError, type ListingRepository } from './listing.repository';
import type { Listing, ListingInput, ListingStatus } from './listing.types';

export class InMemoryListingRepository implements ListingRepository {
  private readonly rows = new Map<string, Listing>();

  async insert(ownerId: string, input: ListingInput): Promise<Listing> {
    if (await this.findByOwner(ownerId)) throw new DuplicateOwnerError();
    const listing: Listing = { id: randomUUID(), ownerId, ...input, status: 'pending' };
    this.rows.set(listing.id, listing);
    return { ...listing };
  }

  async findByOwner(ownerId: string): Promise<Listing | null> {
    const found = [...this.rows.values()].find((l) => l.ownerId === ownerId);
    return found ? { ...found } : null;
  }

  async updateByOwner(ownerId: string, input: ListingInput, status: ListingStatus): Promise<Listing | null> {
    const found = [...this.rows.values()].find((l) => l.ownerId === ownerId);
    if (!found) return null;
    Object.assign(found, input, { status });
    return { ...found };
  }

  async findById(id: string): Promise<Listing | null> {
    const found = this.rows.get(id);
    return found ? { ...found } : null;
  }

  async setStatus(id: string, from: ListingStatus, to: ListingStatus): Promise<Listing | null> {
    const found = this.rows.get(id);
    if (!found || found.status !== from) return null;
    found.status = to;
    return { ...found };
  }

  async listByStatus(status: ListingStatus): Promise<Listing[]> {
    return [...this.rows.values()].filter((l) => l.status === status).map((l) => ({ ...l }));
  }
}
