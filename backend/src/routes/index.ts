import { Router } from 'express';
import { articleRouter } from './article.router.js';
import { authRouter } from './auth.router.js';
import { pollutionRouter } from './pollution.router.js';
import { subscriptionRouter } from './subscription.router.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/pollutions', pollutionRouter);
apiRouter.use('/articles', articleRouter);
apiRouter.use('/subscriptions', subscriptionRouter);
