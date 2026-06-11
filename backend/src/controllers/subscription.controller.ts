import type { Request, Response } from 'express';
import type { CreateSubscriptionDto } from '../dto/subscription.dto.js';
import { getAuthUser } from '../middlewares/auth.js';
import { getValidated } from '../middlewares/validate.js';
import { subscriptionService } from '../services/subscription.service.js';

export const subscriptionController = {
  async create(req: Request, res: Response): Promise<void> {
    const { city } = getValidated<CreateSubscriptionDto>(req, 'body');
    const subscription = await subscriptionService.subscribe(city, getAuthUser(req));
    res.status(201).json(subscription);
  },

  async list(req: Request, res: Response): Promise<void> {
    const subscriptions = await subscriptionService.list(getAuthUser(req));
    res.status(200).json(subscriptions);
  },

  async remove(req: Request, res: Response): Promise<void> {
    const { id } = getValidated<{ id: string }>(req, 'params');
    await subscriptionService.unsubscribe(id, getAuthUser(req));
    res.status(204).send();
  },
};
