import { Response, NextFunction } from 'express';
import { rankingService } from '../services/ranking.service.js';
import { AuthRequest } from '../types/index.js';

export class LeaderboardController {
  async getLeaderboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const data = await rankingService.getLeaderboard(limit, offset);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getTopPlayers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await rankingService.getTopPlayers();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getMyRank(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await rankingService.getUserRank(req.user!.userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}

export const leaderboardController = new LeaderboardController();
