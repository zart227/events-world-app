import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { credentialsSchema } from '../dto/auth.dto.js';
import { requireAuth } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

export const authRouter = Router();

authRouter.post('/register', validate('body', credentialsSchema), authController.register);
authRouter.post('/login', validate('body', credentialsSchema), authController.login);
authRouter.post('/refresh', authController.refresh);
authRouter.post('/logout', authController.logout);
authRouter.post('/logout-all', requireAuth, authController.logoutAll);
