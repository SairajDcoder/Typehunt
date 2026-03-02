import { PrismaClient } from '@prisma/client';
import { redis, RedisKeys } from '../config/redis.js';
import { generateLobbyCode } from '../utils/codeGenerator.js';
import { createAppError } from '../middleware/errorHandler.js';
import { LobbyPlayer, LobbySettings } from '../types/index.js';

const prisma = new PrismaClient();

const DEFAULT_SETTINGS: LobbySettings = {
  wordCount: 30,
  punctuation: false,
  numbers: false,
  capitalization: false,
};

const LOBBY_TTL = 30 * 60; // 30 minutes

export class LobbyService {
  async createLobby(userId: string, username: string, settings?: Partial<LobbySettings>, playerLimit = 8) {
    // Generate unique code
    let code: string;
    let attempts = 0;
    do {
      code = generateLobbyCode();
      const existing = await prisma.lobby.findUnique({ where: { code } });
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      throw createAppError('Failed to generate unique lobby code', 500);
    }

    const mergedSettings = { ...DEFAULT_SETTINGS, ...settings };

    // Create in database
    const lobby = await prisma.lobby.create({
      data: {
        code,
        hostId: userId,
        settings: mergedSettings as any,
        playerLimit: Math.min(Math.max(playerLimit, 2), 16),
      },
    });

    // Store in Redis for fast access
    const lobbyData = {
      id: lobby.id,
      code,
      hostId: userId,
      status: 'WAITING',
      settings: JSON.stringify(mergedSettings),
      playerLimit: lobby.playerLimit.toString(),
      createdAt: Date.now().toString(),
    };

    await redis.hset(RedisKeys.lobby(code), lobbyData);
    await redis.expire(RedisKeys.lobby(code), LOBBY_TTL);

    // Add host as first player
    const hostPlayer: LobbyPlayer = {
      userId,
      username,
      isReady: false,
      isHost: true,
      joinedAt: Date.now(),
    };

    await redis.hset(RedisKeys.lobbyPlayers(code), userId, JSON.stringify(hostPlayer));
    await redis.expire(RedisKeys.lobbyPlayers(code), LOBBY_TTL);

    return { ...lobby, settings: mergedSettings };
  }

  async getLobbyInfo(code: string) {
    // Try Redis first
    const cached = await redis.hgetall(RedisKeys.lobby(code));

    if (cached && Object.keys(cached).length > 0) {
      const players = await this.getLobbyPlayers(code);
      return {
        id: cached.id,
        code,
        hostId: cached.hostId,
        status: cached.status,
        settings: JSON.parse(cached.settings || '{}'),
        playerLimit: parseInt(cached.playerLimit || '8'),
        players,
      };
    }

    // Fallback to database
    const lobby = await prisma.lobby.findUnique({
      where: { code },
    });

    if (!lobby) {
      throw createAppError('Lobby not found', 404);
    }

    return lobby;
  }

  async getLobbyPlayers(code: string): Promise<LobbyPlayer[]> {
    const playersData = await redis.hgetall(RedisKeys.lobbyPlayers(code));
    return Object.values(playersData).map((p) => JSON.parse(p));
  }

  async joinLobby(code: string, userId: string, username: string, avatarUrl?: string) {
    const lobbyData = await redis.hgetall(RedisKeys.lobby(code));

    if (!lobbyData || Object.keys(lobbyData).length === 0) {
      throw createAppError('Lobby not found', 404);
    }

    if (lobbyData.status !== 'WAITING') {
      throw createAppError('Game already in progress', 400);
    }

    const players = await this.getLobbyPlayers(code);

    if (players.length >= parseInt(lobbyData.playerLimit || '8')) {
      throw createAppError('Lobby is full', 400);
    }

    // Check if already in lobby
    const existing = players.find((p) => p.userId === userId);
    if (existing) {
      return { lobby: lobbyData, players };
    }

    const newPlayer: LobbyPlayer = {
      userId,
      username,
      avatarUrl,
      isReady: false,
      isHost: false,
      joinedAt: Date.now(),
    };

    await redis.hset(RedisKeys.lobbyPlayers(code), userId, JSON.stringify(newPlayer));

    return {
      lobby: lobbyData,
      players: [...players, newPlayer],
    };
  }

  async leaveLobby(code: string, userId: string): Promise<{ newHostId?: string; lobbyClosed: boolean }> {
    await redis.hdel(RedisKeys.lobbyPlayers(code), userId);

    const remainingPlayers = await this.getLobbyPlayers(code);

    if (remainingPlayers.length === 0) {
      // Close lobby
      await this.closeLobby(code);
      return { lobbyClosed: true };
    }

    const lobbyData = await redis.hgetall(RedisKeys.lobby(code));

    // If leaving player was host, transfer host
    if (lobbyData.hostId === userId) {
      const newHost = remainingPlayers[0];
      newHost.isHost = true;
      await redis.hset(RedisKeys.lobby(code), 'hostId', newHost.userId);
      await redis.hset(RedisKeys.lobbyPlayers(code), newHost.userId, JSON.stringify(newHost));

      // Update database
      await prisma.lobby.update({
        where: { code },
        data: { hostId: newHost.userId },
      });

      return { newHostId: newHost.userId, lobbyClosed: false };
    }

    return { lobbyClosed: false };
  }

  async updateSettings(code: string, userId: string, settings: Partial<LobbySettings>) {
    const lobbyData = await redis.hgetall(RedisKeys.lobby(code));

    if (!lobbyData || Object.keys(lobbyData).length === 0) {
      throw createAppError('Lobby not found', 404);
    }

    if (lobbyData.hostId !== userId) {
      throw createAppError('Only the host can update settings', 403);
    }

    const currentSettings = JSON.parse(lobbyData.settings || '{}');
    const newSettings = { ...currentSettings, ...settings };

    await redis.hset(RedisKeys.lobby(code), 'settings', JSON.stringify(newSettings));

    // Update database
    await prisma.lobby.update({
      where: { code },
      data: { settings: newSettings as any },
    });

    return newSettings;
  }

  async setPlayerReady(code: string, userId: string, ready: boolean) {
    const playerData = await redis.hget(RedisKeys.lobbyPlayers(code), userId);
    if (!playerData) {
      throw createAppError('Player not found in lobby', 404);
    }

    const player: LobbyPlayer = JSON.parse(playerData);
    player.isReady = ready;
    await redis.hset(RedisKeys.lobbyPlayers(code), userId, JSON.stringify(player));

    return player;
  }

  async closeLobby(code: string) {
    await redis.del(RedisKeys.lobby(code));
    await redis.del(RedisKeys.lobbyPlayers(code));
    await redis.del(RedisKeys.lobbyChat(code));

    await prisma.lobby.update({
      where: { code },
      data: { status: 'CLOSED' },
    }).catch(() => {}); // Ignore if not found
  }

  async setLobbyStatus(code: string, status: string) {
    await redis.hset(RedisKeys.lobby(code), 'status', status);
    await prisma.lobby.update({
      where: { code },
      data: { status: status as any },
    }).catch(() => {});
  }
}

export const lobbyService = new LobbyService();
