import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import pg from 'pg';
import { describe, expect, it } from 'vitest';
import { migrate } from './migrate';

const databaseUrl = process.env.DATABASE_URL;

// Minimal in-process pool double: records what migrate asks for, so the
// idempotency logic is checked without a database.
function fakePool() {
  const recorded = new Set<string>();
  const run = async (sql: string, params?: unknown[]) => {
    if (sql.startsWith('SELECT name')) return { rows: [...recorded].map((name) => ({ name })) };
    if (sql.startsWith('INSERT INTO schema_migrations')) recorded.add(String(params![0]));
    return { rows: [] };
  };
  const client = { query: run, release: () => undefined };
  return { query: run, connect: async () => client } as unknown as pg.Pool;
}

describe('migrate', () => {
  it('applies files once and is idempotent', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'migrations-'));
    await writeFile(path.join(dir, '002_b.sql'), 'SELECT 2;');
    await writeFile(path.join(dir, '001_a.sql'), 'SELECT 1;');
    const pool = fakePool();
    expect(await migrate(pool, dir)).toEqual(['001_a.sql', '002_b.sql']);
    expect(await migrate(pool, dir)).toEqual([]);
  });

  it.runIf(databaseUrl)('enforces the listing constraints in PostgreSQL', async () => {
    const pool = new pg.Pool({ connectionString: databaseUrl });
    try {
      await pool.query('DROP TABLE IF EXISTS restaurant_listings, schema_migrations');
      expect(await migrate(pool)).toContain('001_restaurant_listings.sql');
      const insert = (owner: string, name: string) =>
        pool.query(
          "INSERT INTO restaurant_listings (id, owner_id, name, cuisine, address_city, description) VALUES (gen_random_uuid(), $1, $2, 'Thai', 'Leeds', 'd')",
          [owner, name],
        );
      await expect(insert('o1', '   ')).rejects.toMatchObject({ code: '23514' });
      await insert('o1', 'ok');
      await expect(insert('o1', 'again')).rejects.toMatchObject({ code: '23505' });
    } finally {
      await pool.end();
    }
  });
});
