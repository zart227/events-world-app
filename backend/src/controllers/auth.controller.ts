import type { Request, Response } from 'express';
import type { CredentialsDto } from '../dto/auth.dto.js';
import { getValidated } from '../middlewares/validate.js';
import { authService } from '../services/auth.service.js';

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const credentials = getValidated<CredentialsDto>(req, 'body');
    const user = await authService.register(credentials);
    req.log.info({ userId: user.id }, 'User registered');
    res.status(201).json(user);
  },

  async login(req: Request, res: Response): Promise<void> {
    const credentials = getValidated<CredentialsDto>(req, 'body');
    const user = await authService.login(credentials);
    req.log.info({ userId: user.id }, 'User logged in');
    res.status(200).json(user);
  },
};
