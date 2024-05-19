// src/types/types.ts

export interface LocationData {
    address: string;
    latitude: string;
    longitude: string;
}

export interface PollutionComponents {
    co: number;
    no: number;
    no2: number;
    o3: number;
    so2: number;
    pm2_5: number;
    pm10: number;
    nh3: number;
}

export interface PollutionData {
    components: PollutionComponents;
    aqi: number;
    dateTime: string;
}

export interface PollutionApiResponse {
    list: Array<{
        dt: number;
        main: { aqi: number };
        components: {
            co: number;
            no: number;
            no2: number;
            o3: number;
            so2: number;
            pm2_5: number;
            pm10: number;
            nh3: number;
        };
    }>;
}

export interface CombinedData extends LocationData, PollutionData {}

export type ChartDataType = {
    address: string;
    parameter: string;
    value: number;
};