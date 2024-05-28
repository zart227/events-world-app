// src/services/articlesApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import fetch from 'cross-fetch';
import { ArticleType } from '../types/types';

const SERVER_PORT = process.env.REACT_APP_SERVER_PORT || '3001';
const baseUrl = `//localhost:${SERVER_PORT}/api`;

type ArticlesResponse = ArticleType[];

export const articlesApi = createApi({
  reducerPath: 'articlesApi',
  baseQuery: fetchBaseQuery({ baseUrl, fetchFn: fetch }),
  tagTypes: ['Articles'],
  endpoints: (builder) => ({
    getArticles: builder.query<ArticlesResponse, void>({
      query: () => '/articles',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Articles', id } as const)),
              { type: 'Articles', id: 'LIST' },
            ]
          : [{ type: 'Articles', id: 'LIST' }],
    }),
    getArticle: builder.query<ArticleType, string>({
      query: (id) => `/articles/${id}`,
      providesTags: (result, error, id) => [{ type: 'Articles', id }],
    }),
    addArticle: builder.mutation<ArticleType, Partial<ArticleType>>({
      query: (body) => ({
        url: '/articles',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Articles', id: 'LIST' }],
    }),
    deleteArticle: builder.mutation<void, string>({
      query: (id) => ({
        url: `/articles/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Articles', id: 'LIST' }],
    }),
    deleteAllArticles: builder.mutation<void, void>({
      query: () => ({
        url: '/articles',
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Articles', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetArticlesQuery,
  useGetArticleQuery,
  useAddArticleMutation,
  useDeleteArticleMutation,
  useDeleteAllArticlesMutation,
} = articlesApi;
