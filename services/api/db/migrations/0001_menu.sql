-- Partner menu. Every row carries restaurant_id (shared tables, ADR-0011).
-- restaurant_id has no foreign key yet: the restaurants table arrives with the restaurant management story.
-- Prices are integer pence (GBP). Saved edits are live: no review-state column exists.
CREATE TABLE menu_categories (
  id uuid PRIMARY KEY,
  restaurant_id uuid NOT NULL,
  name text NOT NULL,
  position int NOT NULL
);
CREATE INDEX menu_categories_restaurant_idx ON menu_categories (restaurant_id, position);

-- category_id has no ON DELETE CASCADE: the database also refuses deleting a category that has items.
CREATE TABLE menu_items (
  id uuid PRIMARY KEY,
  restaurant_id uuid NOT NULL,
  category_id uuid NOT NULL REFERENCES menu_categories (id),
  name text NOT NULL,
  description text,
  price_minor int NOT NULL CHECK (price_minor > 0)
);
CREATE INDEX menu_items_category_idx ON menu_items (category_id);

CREATE TABLE menu_item_variants (
  id uuid PRIMARY KEY,
  item_id uuid NOT NULL REFERENCES menu_items (id) ON DELETE CASCADE,
  name text NOT NULL,
  price_minor int NOT NULL CHECK (price_minor > 0),
  position int NOT NULL
);
