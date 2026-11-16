CREATE TABLE restaurant_listings (
  id uuid PRIMARY KEY,
  owner_id text NOT NULL UNIQUE,
  name text NOT NULL CHECK (btrim(name) <> ''),
  cuisine text NOT NULL CHECK (btrim(cuisine) <> ''),
  address_city text NOT NULL CHECK (btrim(address_city) <> ''),
  description text NOT NULL CHECK (btrim(description) <> ''),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX restaurant_listings_status_idx ON restaurant_listings (status);
