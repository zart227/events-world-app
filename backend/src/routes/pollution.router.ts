import { Router } from 'express';
import { pollutionController } from '../controllers/pollution.controller.js';
import { savePollutionSchema } from '../dto/pollution.dto.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

export const pollutionRouter = Router();

pollutionRouter.post(
  '/',
  requireAuth,
  validate('body', savePollutionSchema),
  pollutionController.saveRecord,
);
pollutionRouter.get('/', requireAuth, pollutionController.getHistory);
pollutionRouter.delete('/', requireAuth, requireRole('admin'), pollutionController.clearHistory);
