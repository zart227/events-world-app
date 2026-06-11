import { openWeatherMapClient, type GeocodedCity } from '../clients/openweathermap.client.js';
import { config } from '../config/env.js';
import type {
  CurrentPollutionDto,
  PollutionRecordDto,
  SavePollutionDto,
} from '../dto/pollution.dto.js';
import { pollutionRepository } from '../repositories/pollution.repository.js';
import { cacheService } from './cache.service.js';
import type { AuthUser } from './token.service.js';

export function formatDateTime(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function geoCacheKey(city: string): string {
  return `owm:geo:${city.trim().toLowerCase()}`;
}

function airCacheKey(lat: number, lon: number): string {
  return `owm:air:${lat.toFixed(4)}:${lon.toFixed(4)}`;
}

async function geocodeCityCached(city: string): Promise<GeocodedCity> {
  const key = geoCacheKey(city);
  const cached = await cacheService.get<GeocodedCity>(key);
  if (cached) return cached;

  const geo = await openWeatherMapClient.geocodeCity(city);
  await cacheService.set(key, geo, config.owm.geocodeCacheTtlSeconds);
  return geo;
}

export const pollutionService = {
  /**
   * Прокси к OpenWeatherMap: город -> координаты -> качество воздуха.
   * Ответ кэшируется в Redis на 30 минут, ключ — координаты.
   */
  async getCurrentByCity(city: string): Promise<CurrentPollutionDto> {
    const geo = await geocodeCityCached(city);
    const address = geo.localName ?? geo.name;
    return this.getCurrentByCoords(geo.lat, geo.lon, address);
  },

  /** Качество воздуха по координатам (кэш в Redis, ключ — координаты). */
  async getCurrentByCoords(
    lat: number,
    lon: number,
    address: string,
  ): Promise<CurrentPollutionDto> {
    const key = airCacheKey(lat, lon);
    const cached = await cacheService.get<CurrentPollutionDto>(key);
    if (cached) {
      return { ...cached, address };
    }

    const sample = await openWeatherMapClient.fetchAirPollution(lat, lon);
    const result: CurrentPollutionDto = {
      address,
      latitude: String(lat),
      longitude: String(lon),
      components: sample.components,
      aqi: sample.aqi,
      dateTime: formatDateTime(sample.dt),
      measuredAt: sample.dt,
    };
    await cacheService.set(key, result, config.owm.cacheTtlSeconds);
    return result;
  },

  async saveRecord(data: SavePollutionDto, user: AuthUser): Promise<PollutionRecordDto> {
    return pollutionRepository.create(data, user.id);
  },

  /** Пользователь видит свою историю, admin — всю. */
  async getHistory(user: AuthUser): Promise<PollutionRecordDto[]> {
    if (user.role === 'admin') {
      return pollutionRepository.findAll();
    }
    return pollutionRepository.findAllByUser(user.id);
  },

  /** Очистка всей истории — только admin (контролируется на уровне роутера). */
  async clearHistory(): Promise<number> {
    return pollutionRepository.deleteAll();
  },
};

export type PollutionService = typeof pollutionService;
