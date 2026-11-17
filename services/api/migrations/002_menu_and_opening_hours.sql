ALTER TABLE restaurant_listings
  ADD COLUMN temporarily_closed boolean NOT NULL DEFAULT false,
  ADD COLUMN timezone text NOT NULL DEFAULT 'Europe/London';

CREATE TABLE menu_categories (
  id uuid PRIMARY KEY,
  listing_id uuid NOT NULL REFERENCES restaurant_listings(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (btrim(name) <> ''),
  position int NOT NULL DEFAULT 0
);

-- price is NULL for an item that has size variants.
CREATE TABLE menu_items (
  id uuid PRIMARY KEY,
  category_id uuid NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (btrim(name) <> ''),
  description text NOT NULL DEFAULT '',
  price numeric(10,2) CHECK (price >= 0),
  available boolean NOT NULL DEFAULT true,
  position int NOT NULL DEFAULT 0
);

CREATE TABLE menu_item_sizes (
  id uuid PRIMARY KEY,
  item_id uuid NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (btrim(name) <> ''),
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  position int NOT NULL DEFAULT 0
);

-- weekday is ISO: 1 = Monday ... 7 = Sunday; times are local to the listing's timezone.
CREATE TABLE opening_slots (
  id uuid PRIMARY KEY,
  listing_id uuid NOT NULL REFERENCES restaurant_listings(id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 1 AND 7),
  opens time NOT NULL,
  closes time NOT NULL,
  CHECK (closes > opens)
);

CREATE INDEX menu_categories_listing_idx ON menu_categories (listing_id);
CREATE INDEX menu_items_category_idx ON menu_items (category_id);
CREATE INDEX menu_item_sizes_item_idx ON menu_item_sizes (item_id);
CREATE INDEX opening_slots_listing_idx ON opening_slots (listing_id);
