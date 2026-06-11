import { prisma } from '../db/prisma.js';
import type { SubscriptionDto } from '../dto/subscription.dto.js';
import { Prisma } from '../generated/prisma/client.js';

export interface CityWithSubscribers {
  city: string;
  address: string;
  latitude: string;
  longitude: string;
  userIds: string[];
}

function formatCoordinate(value: { toString(): string }): string {
  return String(Number.parseFloat(value.toString()));
}

function toDto(row: {
  id: string;
  city: string;
  address: string;
  latitude: { toString(): string };
  longitude: { toString(): string };
  createdAt: Date;
}): SubscriptionDto {
  return {
    id: row.id,
    city: row.city,
    address: row.address,
    latitude: formatCoordinate(row.latitude),
    longitude: formatCoordinate(row.longitude),
    created_at: row.createdAt.toISOString(),
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
    try {
      const row = await prisma.citySubscription.create({
        data: {
          userId: data.userId,
          city: data.city,
          address: data.address,
          latitude: data.latitude,
          longitude: data.longitude,
        },
      });
      return toDto(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return null;
      }
      throw error;
    }
  },

  async findAllByUser(userId: string): Promise<SubscriptionDto[]> {
    const rows = await prisma.citySubscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toDto);
  },

  async deleteByIdForUser(id: string, userId: string): Promise<number> {
    const result = await prisma.citySubscription.deleteMany({
      where: { id, userId },
    });
    return result.count;
  },

  /** Города с агрегированным списком подписчиков — для фоновой задачи. */
  async findCitiesWithSubscribers(): Promise<CityWithSubscribers[]> {
    const rows = await prisma.$queryRaw<
      {
        city: string;
        address: string;
        latitude: string;
        longitude: string;
        user_ids: string[];
      }[]
    >`
      SELECT city,
             min(address) AS address,
             min(latitude::text) AS latitude,
             min(longitude::text) AS longitude,
             array_agg(DISTINCT user_id::text) AS user_ids
      FROM city_subscriptions
      GROUP BY city
    `;

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
