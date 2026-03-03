import { Response, NextFunction, Request } from 'express';
import { wordService } from '../services/word.service.js';
import { gameService } from '../services/game.service.js';
import { AuthRequest } from '../types/index.js';
import { redis } from '../config/redis.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class GameController {
  async generateWords(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const count = parseInt(req.query.count as string) || 30;
      const punctuation = req.query.punctuation === 'true';
      const numbers = req.query.numbers === 'true';
      const caps = req.query.caps === 'true';

      const words = wordService.generateWords({ count, punctuation, numbers, capitalization: caps, category: (req.query.category as string) as any || 'common' });
      res.json({ success: true, data: { words, count: words.length } });
    } catch (error) {
      next(error);
    }
  }

  async submitSingleplayer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await gameService.submitSingleplayer(req.user!.userId, req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async submitHardcore(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await gameService.submitHardcore(req.user!.userId, req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getHardcoreHighscores(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const results = await gameService.getHardcoreHighscores(limit);
      res.json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  }

  async getGameHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const results = await gameService.getGameHistory(req.user!.userId, limit, offset);
      res.json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  }
  async getLiveStats(req: Request, res: Response, next: NextFunction) {
    try {
      // Count total registered users
      const totalUsers = await prisma.user.count();

      // Count active lobbies from Redis
      let activeMatches = 0;
      try {
        const keys = await redis.keys('lobby:*');
        activeMatches = keys.length;
      } catch {
        activeMatches = 0;
      }

      // Get average WPM from recent games (last 100)
      const recentGames = await prisma.gameResult.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: { wpm: true },
      });

      let avgWpm = 0;
      if (recentGames.length > 0) {
        const totalWpm = recentGames.reduce((sum: number, g: { wpm: number }) => sum + g.wpm, 0);
        avgWpm = Math.round(totalWpm / recentGames.length);
      }

      res.json({
        success: true,
        data: {
          playersOnline: totalUsers,
          activeMatches,
          avgWpm,
        },
      });
    } catch (error) {
      // Return fallback on error
      res.json({
        success: true,
        data: { playersOnline: 0, activeMatches: 0, avgWpm: 0 },
      });
    }
  }
}

export const gameController = new GameController();
