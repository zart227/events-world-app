import { pool } from '../db/pool.js';
import type {
  PollutionComponentsDto,
  PollutionRecordDto,
  SavePollutionDto,
} from '../dto/pollution.dto.js';

interface PollutionRow {
  id: string;
  address: string;
  latitude: string;
  longitude: string;
  components: PollutionComponentsDto;
  aqi: number;
  date_time: string;
  created_at: Date;
}

const POLLUTION_COLUMNS = 'id, address, latitude, longitude, components, aqi, date_time, created_at';

function toDto(row: PollutionRow): PollutionRecordDto {
  return {
    id: row.id,
    address: row.address,
    // numeric приходит строкой вида "55.750000" — убираем хвостовые нули
    latitude: String(Number.parseFloat(row.latitude)),
    longitude: String(Number.parseFloat(row.longitude)),
    components: row.components,
    aqi: row.aqi,
    dateTime: row.date_time,
    created_at: row.created_at.toISOString(),
  };
}

export const pollutionRepository = {
  async create(data: SavePollutionDto, userId: string | null = null): Promise<PollutionRecordDto> {
    const { rows } = await pool.query<PollutionRow>(
      `INSERT INTO pollution_history (address, latitude, longitude, components, aqi, date_time, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING ${POLLUTION_COLUMNS}`,
      [
        data.address,
        data.latitude,
        data.longitude,
        data.components,
        data.aqi,
        data.dateTime,
        userId,
      ],
    );
    return toDto(rows[0]!);
  },

  async findAll(): Promise<PollutionRecordDto[]> {
    const { rows } = await pool.query<PollutionRow>(
      `SELECT ${POLLUTION_COLUMNS} FROM pollution_history ORDER BY created_at ASC`,
    );
    return rows.map(toDto);
  },

  async findAllByUser(userId: string): Promise<PollutionRecordDto[]> {
    const { rows } = await pool.query<PollutionRow>(
      `SELECT ${POLLUTION_COLUMNS} FROM pollution_history WHERE user_id = $1 ORDER BY created_at ASC`,
      [userId],
    );
    return rows.map(toDto);
  },

  async deleteAll(): Promise<number> {
    const result = await pool.query('DELETE FROM pollution_history');
    return result.rowCount ?? 0;
  },
};

export type PollutionRepository = typeof pollutionRepository;
