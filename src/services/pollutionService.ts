// src/services/pollutionService.ts
// Данные о загрязнении запрашиваются через бэкенд-прокси (/api/pollutions/current):
// ключ OpenWeatherMap хранится только на сервере, ответы кэшируются в Redis.
import { message } from 'antd';
import { PollutionData, CombinedData } from '../types/types';
import { extractErrorMessage } from '../utils/extractErrorMessage';
import api from '../utils/api';

export const getPollutionData = async (latitude: string, longitude: string, address?: string): Promise<PollutionData> => {
    try {
        const { data } = await api.get<CombinedData>('/pollutions/current', {
            params: { lat: latitude, lon: longitude, address },
        });

        return {
            components: data.components,
            aqi: data.aqi,
            dateTime: data.dateTime,
        };
    } catch (error) {
        console.error('Error fetching pollution data:', (error as any).message);
        message.error(extractErrorMessage(error));
        throw error;
    }
};

export const getPollutionByCity = async (city: string): Promise<CombinedData> => {
    const { data } = await api.get<CombinedData>('/pollutions/current', { params: { city } });
    return data;
};
