import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import fetch from 'cross-fetch';
import { GeocoderResponseType } from '../types/types';

const baseUrl = 'https://geocode-maps.yandex.ru/1.x';
const geocoderApiKey = process.env.REACT_APP_YANDEX_API_KEY || '';

export const geocoderApi = createApi({
    reducerPath: 'geocoderApi',
    baseQuery: fetchBaseQuery({ 
        baseUrl: baseUrl,
        fetchFn: fetch 
    }),
    tagTypes: ['GeocoderResponseType'],
    endpoints: (builder) => ({
        getCoordsByAddress: builder.query<GeocoderResponseType, string>({
            query: (address) => {
                return {
                    url: '/',
                    params:{
                        apikey: geocoderApiKey,
                        geocode: address,
                        format: 'json',
                        results: '1'
                    },
                }
            },
        }),
    }),
});

export const { useGetCoordsByAddressQuery } = geocoderApi;
