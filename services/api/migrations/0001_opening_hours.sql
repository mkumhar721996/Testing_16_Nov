create table if not exists restaurants (
  id uuid primary key,
  tenant_id uuid not null,
  name text not null,
  city text not null,
  time_zone text not null default 'UTC', -- IANA name, e.g. America/Bogota
  temporarily_closed boolean not null default false
);

-- A restaurants table created earlier by another story keeps its rows; add what this one needs.
alter table restaurants add column if not exists time_zone text not null default 'UTC';
alter table restaurants add column if not exists temporarily_closed boolean not null default false;

create table if not exists opening_slots (
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 7), -- ISO, 1 = Monday
  opens_at time not null,
  closes_at time not null check (closes_at > opens_at),
  primary key (restaurant_id, weekday, opens_at)
);

create table if not exists orders (
  id uuid primary key,
  restaurant_id uuid not null references restaurants(id),
  status text not null default 'placed',
  placed_at timestamptz not null default now()
);
