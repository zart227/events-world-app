import { openWeatherMapClient } from '../clients/openweathermap.client.js';
import type { SubscriptionDto } from '../dto/subscription.dto.js';
import { ConflictError, NotFoundError } from '../errors/app-error.js';
import { subscriptionRepository } from '../repositories/subscription.repository.js';
import type { AuthUser } from './token.service.js';

export const subscriptionService = {
  async subscribe(city: string, user: AuthUser): Promise<SubscriptionDto> {
    const geo = await openWeatherMapClient.geocodeCity(city);
    const normalizedCity = (geo.localName ?? geo.name).trim();

    const subscription = await subscriptionRepository.create({
      userId: user.id,
      city: normalizedCity,
      address: geo.localName ?? geo.name,
      latitude: geo.lat,
      longitude: geo.lon,
    });
    if (!subscription) {
      throw new ConflictError(`Вы уже подписаны на город «${normalizedCity}»`);
    }
    return subscription;
  },

  async list(user: AuthUser): Promise<SubscriptionDto[]> {
    return subscriptionRepository.findAllByUser(user.id);
  },

  async unsubscribe(id: string, user: AuthUser): Promise<void> {
    const deleted = await subscriptionRepository.deleteByIdForUser(id, user.id);
    if (deleted === 0) {
      throw new NotFoundError('Подписка не найдена');
    }
  },
};

export type SubscriptionService = typeof subscriptionService;
