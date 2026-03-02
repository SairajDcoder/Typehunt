import { Server as SocketServer } from 'socket.io';
import { AuthenticatedSocket } from './index.js';
import { lobbyService } from '../services/lobby.service.js';
import { logger } from '../config/logger.js';
import { redis, RedisKeys } from '../config/redis.js';
import { ChatMessage } from '../types/index.js';

export function setupLobbyHandlers(io: SocketServer, socket: AuthenticatedSocket): void {
  const user = socket.user!;

  /**
   * Join a lobby's Socket.IO room
   */
  socket.on('lobby:join', async (data: { code: string }) => {
    try {
      const { code } = data;
      const upperCode = code.toUpperCase();

      // Join Socket.IO room
      socket.join(`lobby:${upperCode}`);

      // Add to Redis if not already there
      await lobbyService.joinLobby(upperCode, user.userId, user.username);

      const players = await lobbyService.getLobbyPlayers(upperCode);

      // Broadcast to all in lobby
      io.to(`lobby:${upperCode}`).emit('lobby:playerJoined', {
        userId: user.userId,
        username: user.username,
        players,
      });

      logger.info(`${user.username} joined lobby ${upperCode}`);
    } catch (error: any) {
      socket.emit('lobby:error', { message: error.message });
    }
  });

  /**
   * Leave a lobby
   */
  socket.on('lobby:leave', async (data: { code: string }) => {
    try {
      const { code } = data;
      const upperCode = code.toUpperCase();

      const result = await lobbyService.leaveLobby(upperCode, user.userId);
      socket.leave(`lobby:${upperCode}`);

      if (result.lobbyClosed) {
        io.to(`lobby:${upperCode}`).emit('lobby:closed', { reason: 'All players left' });
      } else {
        const players = await lobbyService.getLobbyPlayers(upperCode);

        io.to(`lobby:${upperCode}`).emit('lobby:playerLeft', {
          userId: user.userId,
          username: user.username,
          players,
          newHostId: result.newHostId,
        });
      }

      logger.info(`${user.username} left lobby ${upperCode}`);
    } catch (error: any) {
      socket.emit('lobby:error', { message: error.message });
    }
  });

  /**
   * Toggle ready state
   */
  socket.on('lobby:ready', async (data: { code: string; ready: boolean }) => {
    try {
      const { code, ready } = data;
      const upperCode = code.toUpperCase();

      await lobbyService.setPlayerReady(upperCode, user.userId, ready);
      const players = await lobbyService.getLobbyPlayers(upperCode);

      io.to(`lobby:${upperCode}`).emit('lobby:playerReady', {
        userId: user.userId,
        ready,
        players,
      });
    } catch (error: any) {
      socket.emit('lobby:error', { message: error.message });
    }
  });

  /**
   * Send chat message
   */
  socket.on('lobby:chat', async (data: { code: string; message: string }) => {
    try {
      const { code, message } = data;
      const upperCode = code.toUpperCase();

      if (!message || message.trim().length === 0) return;
      if (message.length > 500) return;

      const chatMessage: ChatMessage = {
        userId: user.userId,
        username: user.username,
        message: message.trim(),
        timestamp: Date.now(),
      };

      // Store in Redis (keep last 100 messages)
      await redis.lpush(RedisKeys.lobbyChat(upperCode), JSON.stringify(chatMessage));
      await redis.ltrim(RedisKeys.lobbyChat(upperCode), 0, 99);

      io.to(`lobby:${upperCode}`).emit('lobby:chatMessage', chatMessage);
    } catch (error: any) {
      socket.emit('lobby:error', { message: error.message });
    }
  });

  /**
   * Host kicks a player
   */
  socket.on('lobby:kick', async (data: { code: string; targetUserId: string }) => {
    try {
      const { code, targetUserId } = data;
      const upperCode = code.toUpperCase();

      // Verify sender is host
      const lobbyData = await redis.hgetall(RedisKeys.lobby(upperCode));
      if (lobbyData.hostId !== user.userId) {
        socket.emit('lobby:error', { message: 'Only the host can kick players' });
        return;
      }

      await lobbyService.leaveLobby(upperCode, targetUserId);
      const players = await lobbyService.getLobbyPlayers(upperCode);

      // Notify kicked player
      io.to(`lobby:${upperCode}`).emit('lobby:playerKicked', {
        kickedUserId: targetUserId,
        players,
      });

      logger.info(`${user.username} kicked ${targetUserId} from lobby ${upperCode}`);
    } catch (error: any) {
      socket.emit('lobby:error', { message: error.message });
    }
  });

  /**
   * Host updates settings via socket
   */
  socket.on('lobby:settings', async (data: { code: string; settings: any }) => {
    try {
      const { code, settings } = data;
      const upperCode = code.toUpperCase();

      const newSettings = await lobbyService.updateSettings(upperCode, user.userId, settings);

      io.to(`lobby:${upperCode}`).emit('lobby:settingsUpdated', { settings: newSettings });
    } catch (error: any) {
      socket.emit('lobby:error', { message: error.message });
    }
  });

  /**
   * Handle disconnect — leave all lobbies
   */
  socket.on('disconnect', async () => {
    // Find which lobbies this user was in and handle leave
    const rooms = Array.from(socket.rooms).filter((r) => r.startsWith('lobby:'));
    for (const room of rooms) {
      const code = room.replace('lobby:', '');
      try {
        const result = await lobbyService.leaveLobby(code, user.userId);
        if (result.lobbyClosed) {
          io.to(room).emit('lobby:closed', { reason: 'Host disconnected' });
        } else {
          const players = await lobbyService.getLobbyPlayers(code);
          io.to(room).emit('lobby:playerLeft', {
            userId: user.userId,
            username: user.username,
            players,
            newHostId: result.newHostId,
            reason: 'disconnect',
          });
        }
      } catch {
        // Ignore errors during cleanup
      }
    }
  });
}
