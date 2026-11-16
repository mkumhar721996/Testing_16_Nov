export interface MenuVariant {
  id: string
  name: string
  priceMinor: number
}

export interface MenuItem {
  id: string
  name: string
  description: string | null
  priceMinor: number
  variants: MenuVariant[]
}

export interface MenuCategory {
  id: string
  name: string
  items: MenuItem[]
}

export interface Menu {
  categories: MenuCategory[]
}

export interface ItemInput {
  name: string
  description: string
  priceMinor: number
  variants: { name: string; priceMinor: number }[]
}
