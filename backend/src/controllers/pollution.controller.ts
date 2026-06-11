import type { Request, Response } from 'express';
import type { CurrentPollutionQueryDto, SavePollutionDto } from '../dto/pollution.dto.js';
import { getAuthUser } from '../middlewares/auth.js';
import { getValidated } from '../middlewares/validate.js';
import { pollutionService } from '../services/pollution.service.js';

export const pollutionController = {
  async getCurrent(req: Request, res: Response): Promise<void> {
    const query = getValidated<CurrentPollutionQueryDto>(req, 'query');
    const data =
      query.city !== undefined
        ? await pollutionService.getCurrentByCity(query.city)
        : await pollutionService.getCurrentByCoords(
            query.lat!,
            query.lon!,
            query.address ?? `${query.lat}, ${query.lon}`,
          );
    res.status(200).json(data);
  },

  async saveRecord(req: Request, res: Response): Promise<void> {
    const data = getValidated<SavePollutionDto>(req, 'body');
    const record = await pollutionService.saveRecord(data, getAuthUser(req));
    res.status(201).json(record);
  },

  async getHistory(req: Request, res: Response): Promise<void> {
    const history = await pollutionService.getHistory(getAuthUser(req));
    res.status(200).json(history);
  },

  async clearHistory(req: Request, res: Response): Promise<void> {
    const deleted = await pollutionService.clearHistory();
    req.log.info({ deleted }, 'Pollution history cleared');
    res.status(204).send();
  },
};
