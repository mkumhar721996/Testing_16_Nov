import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { emptyWeek, WEEKDAYS, type WeekHours } from './opening-hours.domain';

export const DB_POOL = 'DB_POOL';
export const OPENING_HOURS_REPOSITORY = 'OPENING_HOURS_REPOSITORY';

/** Everything the order gate and the partner page need, read in one statement. */
export interface RestaurantHours {
  city: string;
  timeZone: string;
  temporarilyClosed: boolean;
  hours: WeekHours;
}

export interface OpeningHoursRepository {
  /** Null when the restaurant does not exist. Never cached: a close must be seen at once. */
  find(restaurantId: string): Promise<RestaurantHours | null>;
  /** Replaces every slot of the week atomically; a failure leaves the old hours. */
  replaceWeek(restaurantId: string, hours: WeekHours): Promise<void>;
  setTemporarilyClosed(restaurantId: string, closed: boolean): Promise<void>;
}

interface Row {
  city: string;
  time_zone: string;
  temporarily_closed: boolean;
  weekday: number | null;
  opens_at: string | null;
  closes_at: string | null;
}

const hhmm = (time: string): string => time.slice(0, 5);

@Injectable()
export class PgOpeningHoursRepository implements OpeningHoursRepository {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

  async find(restaurantId: string): Promise<RestaurantHours | null> {
    const { rows } = await this.pool.query<Row>(
      `select r.city, r.time_zone, r.temporarily_closed, s.weekday, s.opens_at, s.closes_at
         from restaurants r
         left join opening_slots s on s.restaurant_id = r.id
        where r.id = $1
        order by s.weekday, s.opens_at`,
      [restaurantId],
    );
    if (rows.length === 0) return null;
    const hours = emptyWeek();
    for (const row of rows) {
      if (row.weekday === null || row.opens_at === null || row.closes_at === null) continue;
      hours[WEEKDAYS[row.weekday - 1]].push({ opensAt: hhmm(row.opens_at), closesAt: hhmm(row.closes_at) });
    }
    const { city, time_zone: timeZone, temporarily_closed: temporarilyClosed } = rows[0];
    return { city, timeZone, temporarilyClosed, hours };
  }

  async replaceWeek(restaurantId: string, hours: WeekHours): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('begin');
      await client.query('delete from opening_slots where restaurant_id = $1', [restaurantId]);
      for (const [index, weekday] of WEEKDAYS.entries()) {
        for (const slot of hours[weekday]) {
          await client.query(
            'insert into opening_slots (restaurant_id, weekday, opens_at, closes_at) values ($1, $2, $3, $4)',
            [restaurantId, index + 1, slot.opensAt, slot.closesAt],
          );
        }
      }
      await client.query('commit');
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  }

  async setTemporarilyClosed(restaurantId: string, closed: boolean): Promise<void> {
    await this.pool.query('update restaurants set temporarily_closed = $2 where id = $1', [restaurantId, closed]);
  }
}
