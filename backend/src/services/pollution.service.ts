import type { PollutionRecordDto, SavePollutionDto } from '../dto/pollution.dto.js';
import { pollutionRepository } from '../repositories/pollution.repository.js';
import type { AuthUser } from './token.service.js';

export const pollutionService = {
  async saveRecord(data: SavePollutionDto, user: AuthUser): Promise<PollutionRecordDto> {
    return pollutionRepository.create(data, user.id);
  },

  /** Пользователь видит свою историю, admin — всю. */
  async getHistory(user: AuthUser): Promise<PollutionRecordDto[]> {
    if (user.role === 'admin') {
      return pollutionRepository.findAll();
    }
    return pollutionRepository.findAllByUser(user.id);
  },

  /** Очистка всей истории — только admin (контролируется на уровне роутера). */
  async clearHistory(): Promise<number> {
    return pollutionRepository.deleteAll();
  },
};

export type PollutionService = typeof pollutionService;
