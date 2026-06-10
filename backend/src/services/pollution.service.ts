import type { PollutionRecordDto, SavePollutionDto } from '../dto/pollution.dto.js';
import { pollutionRepository } from '../repositories/pollution.repository.js';

export const pollutionService = {
  async saveRecord(data: SavePollutionDto): Promise<PollutionRecordDto> {
    return pollutionRepository.create(data);
  },

  async getHistory(): Promise<PollutionRecordDto[]> {
    return pollutionRepository.findAll();
  },
};

export type PollutionService = typeof pollutionService;
