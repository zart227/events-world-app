import { Router } from 'express';
import { pollutionController } from '../controllers/pollution.controller.js';
import { savePollutionSchema } from '../dto/pollution.dto.js';
import { validate } from '../middlewares/validate.js';

export const pollutionRouter = Router();

pollutionRouter.post('/', validate('body', savePollutionSchema), pollutionController.saveRecord);
pollutionRouter.get('/', pollutionController.getHistory);
