import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { CombinedData } from '../types/types';

const SERVER_URL=process.env.REACT_APP_SERVER_URL || 'http://localhost';
const SERVER_PORT=process.env.REACT_APP_SERVER_PORT || '3001';

const baseUrl = `${SERVER_URL}:${SERVER_PORT}`;

export const api = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({ baseUrl }),
    endpoints: (builder) => ({
        saveHistory: builder.mutation<void, { location: string; pollutionData: CombinedData }>({
            query: ({ location, pollutionData }) => ({
                url: '/pollutions',
                method: 'POST',
                body: { location, pollutionData },
            }),
        }),
        getHistory: builder.query<CombinedData[], void>({
            query: () => ({
                url: '/pollutions',
                method: 'GET',
            }),
        }),
    }),
});

export const { useSaveHistoryMutation, useGetHistoryQuery } = api;
