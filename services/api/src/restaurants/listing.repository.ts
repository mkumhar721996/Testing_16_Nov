import type { Listing, ListingInput, ListingStatus } from './listing.types';

export class DuplicateOwnerError extends Error {
  constructor() {
    super('Owner already has a restaurant listing');
  }
}

export interface ListingRepository {
  /** Throws DuplicateOwnerError when the owner already has a listing. */
  insert(ownerId: string, input: ListingInput): Promise<Listing>;
  findByOwner(ownerId: string): Promise<Listing | null>;
  updateByOwner(ownerId: string, input: ListingInput, status: ListingStatus): Promise<Listing | null>;
  findById(id: string): Promise<Listing | null>;
  /** Conditional update: only changes the listing while its status is still `from`. */
  setStatus(id: string, from: ListingStatus, to: ListingStatus): Promise<Listing | null>;
  listByStatus(status: ListingStatus): Promise<Listing[]>;
}

export const LISTING_REPOSITORY = Symbol('LISTING_REPOSITORY');
