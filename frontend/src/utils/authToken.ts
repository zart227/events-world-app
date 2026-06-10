// Хранилище access-токена + общий механизм refresh (refresh-токен живёт в httpOnly cookie)
import axios from 'axios';

const API_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost';
const SERVER_PORT = process.env.REACT_APP_SERVER_PORT || '3001';
export const API_BASE_URL = `${API_URL}:${SERVER_PORT}/api`;

const ACCESS_TOKEN_KEY = 'accessToken';

export const getAccessToken = (): string | null => window.localStorage.getItem(ACCESS_TOKEN_KEY);

export const setAccessToken = (token: string): void =>
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);

export const clearAuthStorage = (): void => {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem('user');
};

let refreshPromise: Promise<string> | null = null;

/**
 * Обновляет access-токен через POST /auth/refresh.
 * Параллельные 401 ждут один общий запрос.
 */
export const refreshAccessToken = (): Promise<string> => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<{ user: unknown; accessToken: string }>(
        `${API_BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      )
      .then((response) => {
        const { user, accessToken } = response.data;
        setAccessToken(accessToken);
        window.localStorage.setItem('user', JSON.stringify(user));
        return accessToken;
      })
      .catch((error) => {
        clearAuthStorage();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};
