import { z } from 'zod';

export const createSubscriptionSchema = z.object({
  city: z.string().trim().min(2, 'Укажите город'),
});

export const subscriptionIdSchema = z.object({
  id: z.uuid('Некорректный идентификатор подписки'),
});

export type CreateSubscriptionDto = z.infer<typeof createSubscriptionSchema>;

export interface SubscriptionDto {
  id: string;
  city: string;
  address: string;
  latitude: string;
  longitude: string;
  created_at: string;
}
