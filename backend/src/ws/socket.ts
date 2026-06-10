import type http from 'node:http';
import { Server } from 'socket.io';
import { config } from '../config/env.js';
import { logger } from '../logger/logger.js';
import { tokenService, type AuthUser } from '../services/token.service.js';

let io: Server | null = null;

export function cityRoom(city: string): string {
  return `city:${city.trim().toLowerCase()}`;
}

export function initSocket(server: http.Server): Server {
  io = new Server(server, {
    cors: {
      origin: config.cors.origin,
      credentials: true,
    },
  });

  // Аутентификация сокета по access-токену из handshake
  io.use((socket, next) => {
    const token = socket.handshake.auth['token'] as string | undefined;
    if (!token) {
      next(new Error('Unauthorized'));
      return;
    }
    try {
      (socket.data as { user: AuthUser }).user = tokenService.verifyAccessToken(token);
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const { user } = socket.data as { user: AuthUser };
    logger.debug({ userId: user.id, socketId: socket.id }, 'WebSocket connected');

    socket.on('city:subscribe', (city: string) => {
      if (typeof city === 'string' && city.trim()) {
        void socket.join(cityRoom(city));
      }
    });

    socket.on('city:unsubscribe', (city: string) => {
      if (typeof city === 'string' && city.trim()) {
        void socket.leave(cityRoom(city));
      }
    });
  });

  return io;
}

export function emitPollutionUpdate(city: string, payload: unknown): void {
  io?.to(cityRoom(city)).emit('pollution:update', payload);
}

export async function closeSocket(): Promise<void> {
  if (io) {
    await io.close();
    io = null;
    logger.info('Socket.io server closed');
  }
}
