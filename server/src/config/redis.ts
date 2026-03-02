import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  lazyConnect: true,
});

redis.on('connect', () => {
  logger.info('✅ Redis connected');
});

redis.on('error', (err) => {
  logger.error('❌ Redis connection error:', err);
});

export async function connectRedis(): Promise<void> {
  try {
    await redis.connect();
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
}

// Helper functions for lobby state management
export const RedisKeys = {
  lobby: (code: string) => `lobby:${code}`,
  lobbyPlayers: (code: string) => `lobby:${code}:players`,
  lobbyChat: (code: string) => `lobby:${code}:chat`,
  gameState: (code: string) => `game:${code}`,
  gameProgress: (code: string, userId: string) => `game:${code}:progress:${userId}`,
  wordSet: (gameId: string) => `wordset:${gameId}`,
  activeSession: (userId: string) => `session:${userId}`,
} as const;
