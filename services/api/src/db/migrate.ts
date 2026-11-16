import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';

const DEFAULT_DIR = path.resolve(__dirname, '../../migrations');

/** Applies each not-yet-recorded `*.sql` file in name order; returns the names applied. */
export async function migrate(pool: pg.Pool, dir: string = DEFAULT_DIR): Promise<string[]> {
  await pool.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
  const done = new Set((await pool.query<{ name: string }>('SELECT name FROM schema_migrations')).rows.map((r) => r.name));
  const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();
  const applied: string[] = [];
  for (const file of files) {
    if (done.has(file)) continue;
    const sql = await readFile(path.join(dir, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    applied.push(file);
  }
  return applied;
}

if (require.main === module) {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  migrate(pool)
    .then((applied) => console.log(applied.length ? `Applied: ${applied.join(', ')}` : 'Nothing to apply'))
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
