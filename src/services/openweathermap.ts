import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import fetch from 'cross-fetch';
import { PollutionApiResponse } from '../types/types';

const baseUrl = 'https://api.openweathermap.org/data/2.5';
const pollutionApiKey = process.env.REACT_APP_OPENWEATHERMAP_API_KEY || '';

export const openWeatherMapApi = createApi({
    reducerPath: 'openWeatherMapApi',
    baseQuery: fetchBaseQuery({ baseUrl, fetchFn: fetch }),
    endpoints: (builder) => ({
        getAirPollutionByCoords: builder.query<PollutionApiResponse, { lat: string; lon: string }>({
            query: ({ lat, lon }) => ({
                url: '/air_pollution',
                params: {
                    appid: pollutionApiKey,
                    lat,
                    lon,
                },
            }),
        }),
    }),
});

export const { useGetAirPollutionByCoordsQuery } = openWeatherMapApi;
