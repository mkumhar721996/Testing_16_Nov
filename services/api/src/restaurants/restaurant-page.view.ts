import type { MenuCategory, OpeningSlot } from './menu.types';
import type { NextOpening } from './open-status';

export interface RestaurantPageView {
  id: string;
  name: string;
  cuisine: string;
  addressCity: string;
  description: string;
  isOpen: boolean;
  temporarilyClosed: boolean;
  closesAt: string | null;
  today: number;
  nextOpening: NextOpening | null;
  hours: OpeningSlot[];
  categories: MenuCategory[];
}
