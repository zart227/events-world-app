// src/services/articlesApi.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import { ArticleType, ArticlesPage, ArticlesQuery } from '../types/types';
import { baseQueryWithReauth } from './baseQuery';

export const articlesApi = createApi({
  reducerPath: 'articlesApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Articles'],
  endpoints: (builder) => ({
    getArticles: builder.query<ArticlesPage, ArticlesQuery | void>({
      query: (params) => ({
        url: '/articles',
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'Articles', id } as const)),
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
