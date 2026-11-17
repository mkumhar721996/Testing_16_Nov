export interface MenuSize {
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  /** null for an item that has size variants. */
  price: number | null;
  available: boolean;
  sizes: MenuSize[];
}

export interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

/** weekday is ISO: 1 = Monday ... 7 = Sunday; times are 'HH:MM' local to the restaurant. */
export interface OpeningSlot {
  weekday: number;
  opens: string;
  closes: string;
}

export interface RestaurantSchedule {
  timezone: string;
  temporarilyClosed: boolean;
  slots: OpeningSlot[];
}
