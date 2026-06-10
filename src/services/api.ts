import { createApi } from '@reduxjs/toolkit/query/react';
import { CombinedData } from '../types/types';
import { baseQueryWithReauth } from './baseQuery';

export const api = createApi({
    reducerPath: 'api',
    baseQuery: baseQueryWithReauth,
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
