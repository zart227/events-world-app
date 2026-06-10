import { config } from '../config/env.js';
import { AppError, BadRequestError, NotFoundError } from '../errors/app-error.js';
import type { PollutionComponentsDto } from '../dto/pollution.dto.js';

const GEO_URL = 'https://api.openweathermap.org/geo/1.0/direct';
const AIR_POLLUTION_URL = 'https://api.openweathermap.org/data/2.5/air_pollution';

export interface GeocodedCity {
  name: string;
  localName?: string;
  lat: number;
  lon: number;
  country: string;
}

export interface AirPollutionSample {
  aqi: number;
  components: PollutionComponentsDto;
  dt: number;
}

interface OwmGeoEntry {
  name: string;
  local_names?: Record<string, string>;
  lat: number;
  lon: number;
  country: string;
}

interface OwmAirPollutionResponse {
  list: Array<{
    dt: number;
    main: { aqi: number };
    components: PollutionComponentsDto;
  }>;
}

class UpstreamError extends AppError {
  constructor(status: number, body: string) {
    super('Ошибка внешнего сервиса OpenWeatherMap', 502, 'UPSTREAM_ERROR', {
      details: { status, body: body.slice(0, 500) },
    });
  }
}

function requireApiKey(): string {
  if (!config.owm.apiKey) {
    throw new AppError(
      'OPENWEATHERMAP_API_KEY не сконфигурирован на сервере',
      503,
      'OWM_NOT_CONFIGURED',
    );
  }
  return config.owm.apiKey;
}

async function owmFetch<T>(url: URL): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new UpstreamError(response.status, await response.text());
  }
  return (await response.json()) as T;
}

export const openWeatherMapClient = {
  async geocodeCity(city: string): Promise<GeocodedCity> {
    const url = new URL(GEO_URL);
    url.searchParams.set('q', city);
    url.searchParams.set('limit', '1');
    url.searchParams.set('appid', requireApiKey());

    const entries = await owmFetch<OwmGeoEntry[]>(url);
    const entry = entries[0];
    if (!entry) {
      throw new NotFoundError(`Город «${city}» не найден`);
    }
    const result: GeocodedCity = {
      name: entry.name,
      lat: entry.lat,
      lon: entry.lon,
      country: entry.country,
    };
    const localName = entry.local_names?.ru;
    if (localName) {
      result.localName = localName;
    }
    return result;
  },

  async fetchAirPollution(lat: number, lon: number): Promise<AirPollutionSample> {
    const url = new URL(AIR_POLLUTION_URL);
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lon));
    url.searchParams.set('appid', requireApiKey());

    const data = await owmFetch<OwmAirPollutionResponse>(url);
    const sample = data.list[0];
    if (!sample) {
      throw new BadRequestError('OpenWeatherMap не вернул данных о загрязнении');
    }
    return { aqi: sample.main.aqi, components: sample.components, dt: sample.dt };
  },
};

export type OpenWeatherMapClient = typeof openWeatherMapClient;
