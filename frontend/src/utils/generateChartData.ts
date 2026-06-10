// src/utils/generateChartData.ts
import { CombinedData, ChartDataType } from '../types/types';

export const generateChartData = (data: CombinedData[]): ChartDataType[] => {
    return data.flatMap((d) => [
        { address: d.address, parameter: 'CO (угарный газ)', value: d.components.co },
        { address: d.address, parameter: 'NO (оксид азота)', value: d.components.no },
        { address: d.address, parameter: 'NO2 (диоксид азота)', value: d.components.no2 },
        { address: d.address, parameter: 'O3 (озон)', value: d.components.o3 },
        { address: d.address, parameter: 'SO2 (диоксид серы)', value: d.components.so2 },
        { address: d.address, parameter: 'PM2.5 (мелкие частицы)', value: d.components.pm2_5 },
        { address: d.address, parameter: 'PM10 (крупные частицы)', value: d.components.pm10 },
        { address: d.address, parameter: 'NH3 (аммиак)', value: d.components.nh3 },
    ]);
};
