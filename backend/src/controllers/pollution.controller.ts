import type { Request, Response } from 'express';
import type { SavePollutionDto } from '../dto/pollution.dto.js';
import { getValidated } from '../middlewares/validate.js';
import { pollutionService } from '../services/pollution.service.js';

export const pollutionController = {
  async saveRecord(req: Request, res: Response): Promise<void> {
    const data = getValidated<SavePollutionDto>(req, 'body');
    const record = await pollutionService.saveRecord(data);
    res.status(201).json(record);
  },

  async getHistory(_req: Request, res: Response): Promise<void> {
    const history = await pollutionService.getHistory();
    res.status(200).json(history);
  },
};
