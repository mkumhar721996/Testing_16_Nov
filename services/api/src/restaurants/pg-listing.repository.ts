import { Inject, Injectable } from '@nestjs/common';
import pg from 'pg';
import { DuplicateOwnerError, type ListingRepository } from './listing.repository';
import type { Listing, ListingInput, ListingStatus } from './listing.types';

export const PG_POOL = Symbol('PG_POOL');

const COLUMNS = 'id, owner_id, name, cuisine, address_city, description, status';

interface Row {
  id: string;
  owner_id: string;
  name: string;
  cuisine: string;
  address_city: string;
  description: string;
  status: ListingStatus;
}

function toListing(r: Row): Listing {
  return {
    id: r.id,
    ownerId: r.owner_id,
    name: r.name,
    cuisine: r.cuisine,
    addressCity: r.address_city,
    description: r.description,
    status: r.status,
  };
}

@Injectable()
export class PgListingRepository implements ListingRepository {
  constructor(@Inject(PG_POOL) private readonly pool: pg.Pool) {}

  async insert(ownerId: string, input: ListingInput): Promise<Listing> {
    try {
      const { rows } = await this.pool.query<Row>(
        `INSERT INTO restaurant_listings (id, owner_id, name, cuisine, address_city, description)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5) RETURNING ${COLUMNS}`,
        [ownerId, input.name, input.cuisine, input.addressCity, input.description],
      );
      return toListing(rows[0]);
    } catch (err) {
      if ((err as { code?: string }).code === '23505') throw new DuplicateOwnerError();
      throw err;
    }
  }

  async findByOwner(ownerId: string): Promise<Listing | null> {
    const { rows } = await this.pool.query<Row>(`SELECT ${COLUMNS} FROM restaurant_listings WHERE owner_id = $1`, [ownerId]);
    return rows[0] ? toListing(rows[0]) : null;
  }

  async updateByOwner(ownerId: string, input: ListingInput, status: ListingStatus): Promise<Listing | null> {
    const { rows } = await this.pool.query<Row>(
      `UPDATE restaurant_listings
       SET name = $2, cuisine = $3, address_city = $4, description = $5, status = $6, updated_at = now()
       WHERE owner_id = $1 RETURNING ${COLUMNS}`,
      [ownerId, input.name, input.cuisine, input.addressCity, input.description, status],
    );
    return rows[0] ? toListing(rows[0]) : null;
  }

  async findById(id: string): Promise<Listing | null> {
    if (!UUID.test(id)) return null;
    const { rows } = await this.pool.query<Row>(`SELECT ${COLUMNS} FROM restaurant_listings WHERE id = $1`, [id]);
    return rows[0] ? toListing(rows[0]) : null;
  }

  async setStatus(id: string, from: ListingStatus, to: ListingStatus): Promise<Listing | null> {
    if (!UUID.test(id)) return null;
    const { rows } = await this.pool.query<Row>(
      `UPDATE restaurant_listings SET status = $3, updated_at = now()
       WHERE id = $1 AND status = $2 RETURNING ${COLUMNS}`,
      [id, from, to],
    );
    return rows[0] ? toListing(rows[0]) : null;
  }

  async listByStatus(status: ListingStatus): Promise<Listing[]> {
    const { rows } = await this.pool.query<Row>(
      `SELECT ${COLUMNS} FROM restaurant_listings WHERE status = $1 ORDER BY created_at, id`,
      [status],
    );
    return rows.map(toListing);
  }
}

// A non-UUID id can never match; checking avoids a Postgres cast error (500) for unknown ids.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
