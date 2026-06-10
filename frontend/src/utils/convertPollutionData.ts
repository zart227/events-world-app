// src/utils/convertPollutionData.ts
import { PollutionApiResponse, PollutionData } from '../types/types';

export const convertPollutionData = (apiResponse: PollutionApiResponse): PollutionData => {
    const { list } = apiResponse;
    const [firstData] = list;
    const { dt, main, components } = firstData;

    return {
        aqi: main.aqi,
        components,
        dateTime: new Date(dt * 1000).toISOString(), // преобразование времени из UNIX формата
    };
};
