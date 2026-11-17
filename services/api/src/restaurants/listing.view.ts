import type { Listing, ListingStatus } from './listing.types';

export interface ListingView {
  id: string;
  name: string;
  cuisine: string;
  addressCity: string;
  description: string;
  status: ListingStatus;
}

/** Public shape of a listing: never exposes ownerId. */
export function toView(l: Listing): ListingView {
  return { id: l.id, name: l.name, cuisine: l.cuisine, addressCity: l.addressCity, description: l.description, status: l.status };
}
