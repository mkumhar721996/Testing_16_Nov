export interface VariantInput {
  name: string;
  priceMinor: number;
}

export interface ItemInput {
  name: string;
  description: string | null;
  priceMinor: number;
  variants: VariantInput[];
}

export interface MenuVariant extends VariantInput {
  id: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  priceMinor: number;
  variants: MenuVariant[];
}

export interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

export interface Menu {
  categories: MenuCategory[];
}
