// src/services/socket.ts — WebSocket-подключение для push-обновлений по подпискам
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL, getAccessToken } from '../utils/authToken';

const SERVER_URL = API_BASE_URL.replace(/\/api$/, '');

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SERVER_URL, {
      withCredentials: true,
      auth: (cb) => cb({ token: getAccessToken() }),
    });
  }
  return socket;
};

export const disconnectSocket = (): void => {
  socket?.disconnect();
  socket = null;
};
