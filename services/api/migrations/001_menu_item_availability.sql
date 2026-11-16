CREATE TABLE IF NOT EXISTS menu_items (
  id            text PRIMARY KEY,
  restaurant_id text NOT NULL,
  name          text NOT NULL,
  description   text NOT NULL DEFAULT '',
  price_minor   integer NOT NULL CHECK (price_minor >= 0),
  available     boolean NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS menu_items_restaurant_idx ON menu_items (restaurant_id);
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS available boolean NOT NULL DEFAULT true;
