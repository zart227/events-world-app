import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import type { Decorator } from '@storybook/react';
import { AuthProvider } from '../context/AuthContext';
import AppLayout from '../components/Layout/Layout';
import { geocoderApi } from '../services/geocoder';
import { articlesApi } from '../services/articlesApi';
import pollutionsReducer from '../store/pollutionsSlice';
import type { AppDispatch, RootState } from '../store';
import { ArticlesPage, ArticlesSort, CombinedData } from '../types/types';

const createBaseStore = (preloadedState?: Partial<RootState>) =>
  configureStore({
    reducer: {
      [geocoderApi.reducerPath]: geocoderApi.reducer,
      [articlesApi.reducerPath]: articlesApi.reducer,
      pollutions: pollutionsReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .concat(geocoderApi.middleware)
        .concat(articlesApi.middleware),
    preloadedState,
  } as Parameters<typeof configureStore>[0]);

export const withRouter =
  (initialEntries: string[] = ['/']): Decorator =>
  (Story) => (
    <MemoryRouter initialEntries={initialEntries}>
      <Story />
    </MemoryRouter>
  );

export const withAuth =
  (loggedIn = false): Decorator =>
  (Story) => {
    if (loggedIn) {
      window.localStorage.setItem(
        'user',
        JSON.stringify({ id: '1', email: 'user@example.com', role: 'user' }),
      );
    } else {
      window.localStorage.removeItem('user');
    }

    return (
      <AuthProvider key={loggedIn ? 'auth-in' : 'auth-out'}>
        <Story />
      </AuthProvider>
    );
  };

export const withRedux =
  (preloadedState?: Partial<RootState>): Decorator =>
  (Story) => {
    const store = createBaseStore(preloadedState);
    return (
      <Provider store={store}>
        <Story />
      </Provider>
    );
  };

export const withLayout =
  (initialEntries: string[] = ['/']): Decorator =>
  (Story) => (
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Story />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

export const withPollutions =
  (pollutions: CombinedData[]): Decorator =>
  withRedux({ pollutions: { list: pollutions } });

export const withArticles =
  (
    articlesPage: ArticlesPage,
    query: { page?: number; limit?: number; sort?: ArticlesSort; q?: string } = {
      page: 1,
      limit: 10,
      sort: 'created_at:desc',
    },
  ): Decorator =>
  (Story) => {
    const store = createBaseStore();
    (store.dispatch as AppDispatch)(
      articlesApi.util.upsertQueryData('getArticles', query, articlesPage),
    );
    return (
      <Provider store={store}>
        <Story />
      </Provider>
    );
  };

export const withArticle =
  (article: ArticlesPage['items'][number], id = article.id): Decorator =>
  (Story) => {
    const store = createBaseStore();
    (store.dispatch as AppDispatch)(
      articlesApi.util.upsertQueryData('getArticle', id, article),
    );
    return (
      <Provider store={store}>
        <Story />
      </Provider>
    );
  };
