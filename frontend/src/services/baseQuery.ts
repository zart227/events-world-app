// Общий baseQuery для RTK Query: Authorization-заголовок + авто-refresh на 401
import {
  BaseQueryFn,
  FetchArgs,
  fetchBaseQuery,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { API_BASE_URL, getAccessToken, refreshAccessToken } from '../utils/authToken';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: 'include',
  prepareHeaders: (headers) => {
    const token = getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> =
  async (args, queryApi, extraOptions) => {
    let result = await rawBaseQuery(args, queryApi, extraOptions);
    if (result.error?.status === 401) {
      try {
        await refreshAccessToken();
        result = await rawBaseQuery(args, queryApi, extraOptions);
      } catch {
        // refresh не удался — отдаём исходную 401
      }
    }
    return result;
  };
