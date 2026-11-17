import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { migrate } from '../db/migrate';
import { DuplicateOwnerError } from './listing.repository';
import { PgListingRepository } from './pg-listing.repository';

const databaseUrl = process.env.DATABASE_URL;
const input = { name: 'Saffron & Spice', cuisine: 'Indian', addressCity: 'Leeds', description: 'Family-run' };

describe.runIf(databaseUrl)('PgListingRepository (PostgreSQL)', () => {
  const pool = new pg.Pool({ connectionString: databaseUrl });
  const repo = new PgListingRepository(pool);

  beforeAll(async () => {
    await migrate(pool);
  });
  beforeEach(async () => {
    await pool.query('DELETE FROM restaurant_listings');
  });
  afterAll(async () => {
    await pool.end();
  });

  it('raises DuplicateOwnerError on a second insert for one owner (AC 12)', async () => {
    await repo.insert('p1', input);
    await expect(repo.insert('p1', input)).rejects.toBeInstanceOf(DuplicateOwnerError);
  });

  it('setStatus only changes a listing still in the expected status', async () => {
    const created = await repo.insert('p1', input);
    expect((await repo.setStatus(created.id, 'pending', 'approved'))?.status).toBe('approved');
    expect(await repo.setStatus(created.id, 'pending', 'rejected')).toBeNull();
    expect(await repo.setStatus('not-a-uuid', 'pending', 'rejected')).toBeNull();
  });
});
