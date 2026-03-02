import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AuthPayload } from '../types/index.js';
import { setupLobbyHandlers } from './lobby.socket.js';
import { setupGameHandlers } from './game.socket.js';

export interface AuthenticatedSocket extends Socket {
  user?: AuthPayload;
}

export function initializeSocketIO(io: SocketServer): void {
  // Socket.IO authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token as string, env.JWT_SECRET) as AuthPayload;
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`Socket connected: ${socket.user?.username} (${socket.id})`);

    // Register event handlers
    setupLobbyHandlers(io, socket);
    setupGameHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.user?.username} - ${reason}`);
    });

    socket.on('error', (error) => {
      logger.error(`Socket error: ${socket.user?.username} - ${error.message}`);
    });
  });

  logger.info('Socket.IO initialized');
}
