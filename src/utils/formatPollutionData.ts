// src/utils/formatPollutionData.ts
import { CombinedData, LocationData, PollutionData } from '../types/types';

export const formatPollutionData = (location: LocationData, pollutionData: PollutionData): CombinedData => {
    return {
        ...location,
        ...pollutionData,
    };
};
