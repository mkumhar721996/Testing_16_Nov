import type { MenuItem } from './menu-item';

// Development and e2e only: the in-memory repository starts with these items.
export const DEV_MENU_ITEMS: MenuItem[] = [
  { id: 'onion-bhaji', restaurantId: 'r1', name: 'Onion bhaji', description: '', priceMinor: 450, available: true },
  { id: 'samosa', restaurantId: 'r1', name: 'Samosa', description: '', priceMinor: 400, available: true },
  { id: 'dal', restaurantId: 'r2', name: 'Dal', description: '', priceMinor: 700, available: true },
];
