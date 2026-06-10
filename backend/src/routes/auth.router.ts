import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { credentialsSchema } from '../dto/auth.dto.js';
import { validate } from '../middlewares/validate.js';

export const authRouter = Router();

authRouter.post('/register', validate('body', credentialsSchema), authController.register);
authRouter.post('/login', validate('body', credentialsSchema), authController.login);
