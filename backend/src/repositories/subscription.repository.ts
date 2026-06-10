import { pool } from '../db/pool.js';
import type { SubscriptionDto } from '../dto/subscription.dto.js';

interface SubscriptionRow {
  id: string;
  user_id: string;
  city: string;
  address: string;
  latitude: string;
  longitude: string;
  created_at: Date;
}

export interface CityWithSubscribers {
  city: string;
  address: string;
  latitude: string;
  longitude: string;
  userIds: string[];
}

const COLUMNS = 'id, user_id, city, address, latitude, longitude, created_at';

function toDto(row: SubscriptionRow): SubscriptionDto {
  return {
    id: row.id,
    city: row.city,
    address: row.address,
    latitude: String(Number.parseFloat(row.latitude)),
    longitude: String(Number.parseFloat(row.longitude)),
    created_at: row.created_at.toISOString(),
  };
}

export const subscriptionRepository = {
  async create(data: {
    userId: string;
    city: string;
    address: string;
    latitude: number;
    longitude: number;
  }): Promise<SubscriptionDto | null> {
    const { rows } = await pool.query<SubscriptionRow>(
      `INSERT INTO city_subscriptions (user_id, city, address, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, city) DO NOTHING
       RETURNING ${COLUMNS}`,
      [data.userId, data.city, data.address, data.latitude, data.longitude],
    );
    return rows[0] ? toDto(rows[0]) : null;
  },

  async findAllByUser(userId: string): Promise<SubscriptionDto[]> {
    const { rows } = await pool.query<SubscriptionRow>(
      `SELECT ${COLUMNS} FROM city_subscriptions WHERE user_id = $1 ORDER BY created_at ASC`,
      [userId],
    );
    return rows.map(toDto);
  },

  async deleteByIdForUser(id: string, userId: string): Promise<number> {
    const result = await pool.query(
      'DELETE FROM city_subscriptions WHERE id = $1 AND user_id = $2',
      [id, userId],
    );
    return result.rowCount ?? 0;
  },

  /** Города с агрегированным списком подписчиков — для фоновой задачи. */
  async findCitiesWithSubscribers(): Promise<CityWithSubscribers[]> {
    const { rows } = await pool.query<{
      city: string;
      address: string;
      latitude: string;
      longitude: string;
      user_ids: string[];
    }>(
      `SELECT city,
              min(address) AS address,
              min(latitude) AS latitude,
              min(longitude) AS longitude,
              array_agg(DISTINCT user_id) AS user_ids
       FROM city_subscriptions
       GROUP BY city`,
    );
    return rows.map((row) => ({
      city: row.city,
      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude,
      userIds: row.user_ids,
    }));
  },
};

export type SubscriptionRepository = typeof subscriptionRepository;
