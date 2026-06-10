import { Router } from 'express';
import { subscriptionController } from '../controllers/subscription.controller.js';
import { createSubscriptionSchema, subscriptionIdSchema } from '../dto/subscription.dto.js';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

export const subscriptionRouter = Router();

subscriptionRouter.use(requireAuth);
subscriptionRouter.post('/', validate('body', createSubscriptionSchema), subscriptionController.create);
subscriptionRouter.get('/', subscriptionController.list);
subscriptionRouter.delete('/:id', validate('params', subscriptionIdSchema), subscriptionController.remove);
