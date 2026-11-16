export type ListingStatus = 'pending' | 'approved' | 'rejected';

export interface Listing {
  id: string;
  ownerId: string;
  name: string;
  cuisine: string;
  addressCity: string;
  description: string;
  status: ListingStatus;
}

export interface ListingInput {
  name: string;
  cuisine: string;
  addressCity: string;
  description: string;
}

export const LISTING_FIELDS = ['name', 'cuisine', 'addressCity', 'description'] as const;
