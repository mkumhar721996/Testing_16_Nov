import pg from 'pg';

export function createPool(connectionString = process.env.DATABASE_URL): pg.Pool {
  return new pg.Pool({ connectionString });
}
