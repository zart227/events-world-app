import cron, { type ScheduledTask } from 'node-cron';
import { openWeatherMapClient } from '../clients/openweathermap.client.js';
import { config } from '../config/env.js';
import type { CurrentPollutionDto } from '../dto/pollution.dto.js';
import { logger } from '../logger/logger.js';
import { pollutionRepository } from '../repositories/pollution.repository.js';
import { subscriptionRepository } from '../repositories/subscription.repository.js';
import { cacheService } from '../services/cache.service.js';
import { formatDateTime } from '../services/pollution.service.js';
import { emitPollutionUpdate } from '../ws/socket.js';

/**
 * Обновляет данные о загрязнении по всем городам из подписок:
 * пишет запись в pollution_history каждому подписчику, освежает кэш
 * и рассылает push через WebSocket.
 */
export async function refreshSubscribedCities(): Promise<void> {
  const cities = await subscriptionRepository.findCitiesWithSubscribers();
  if (cities.length === 0) return;

  logger.info({ cities: cities.length }, 'Refreshing pollution data for subscribed cities');

  for (const entry of cities) {
    try {
      const lat = Number.parseFloat(entry.latitude);
      const lon = Number.parseFloat(entry.longitude);
      const sample = await openWeatherMapClient.fetchAirPollution(lat, lon);

      const dto: CurrentPollutionDto = {
        address: entry.address,
        latitude: String(lat),
        longitude: String(lon),
        components: sample.components,
        aqi: sample.aqi,
        dateTime: formatDateTime(sample.dt),
        measuredAt: sample.dt,
      };

      // Освежаем кэш, чтобы /current отдавал те же данные
      await cacheService.set(`owm:air:${lat.toFixed(4)}:${lon.toFixed(4)}`, dto, config.owm.cacheTtlSeconds);

      for (const userId of entry.userIds) {
        await pollutionRepository.create(
          {
            address: dto.address,
            latitude: dto.latitude,
            longitude: dto.longitude,
            components: dto.components,
            aqi: dto.aqi,
            dateTime: dto.dateTime,
          },
          userId,
        );
      }

      emitPollutionUpdate(entry.city, dto);
    } catch (err) {
      logger.error({ err, city: entry.city }, 'Failed to refresh pollution data for city');
    }
  }
}

export function startPollutionRefreshJob(): ScheduledTask | null {
  if (!config.cron.enabled) {
    logger.info('Pollution refresh cron is disabled');
    return null;
  }
  const task = cron.schedule(config.cron.pollutionRefreshSchedule, () => {
    refreshSubscribedCities().catch((err) => {
      logger.error({ err }, 'Pollution refresh job failed');
    });
  });
  logger.info(
    { schedule: config.cron.pollutionRefreshSchedule },
    'Pollution refresh cron scheduled',
  );
  return task;
}
