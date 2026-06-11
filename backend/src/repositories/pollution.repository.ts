import { prisma } from '../db/prisma.js';
import type {
  PollutionComponentsDto,
  PollutionRecordDto,
  SavePollutionDto,
} from '../dto/pollution.dto.js';

function formatCoordinate(value: { toString(): string }): string {
  return String(Number.parseFloat(value.toString()));
}

function toDto(row: {
  id: string;
  address: string;
  latitude: { toString(): string };
  longitude: { toString(): string };
  components: unknown;
  aqi: number;
  dateTime: string;
  createdAt: Date;
}): PollutionRecordDto {
  return {
    id: row.id,
    address: row.address,
    latitude: formatCoordinate(row.latitude),
    longitude: formatCoordinate(row.longitude),
    components: row.components as PollutionComponentsDto,
    aqi: row.aqi,
    dateTime: row.dateTime,
    created_at: row.createdAt.toISOString(),
  };
}

export const pollutionRepository = {
  async create(data: SavePollutionDto, userId: string | null = null): Promise<PollutionRecordDto> {
    const row = await prisma.pollutionHistory.create({
      data: {
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        components: data.components,
        aqi: data.aqi,
        dateTime: data.dateTime,
        userId,
      },
    });
    return toDto(row);
  },

  async findAll(): Promise<PollutionRecordDto[]> {
    const rows = await prisma.pollutionHistory.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toDto);
  },

  async findAllByUser(userId: string): Promise<PollutionRecordDto[]> {
    const rows = await prisma.pollutionHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toDto);
  },

  async deleteAll(): Promise<number> {
    const result = await prisma.pollutionHistory.deleteMany();
    return result.count;
  },
};

export type PollutionRepository = typeof pollutionRepository;
