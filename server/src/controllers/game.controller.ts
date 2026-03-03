import { Response, NextFunction } from 'express';
import { wordService } from '../services/word.service.js';
import { gameService } from '../services/game.service.js';
import { AuthRequest } from '../types/index.js';

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
}

export const gameController = new GameController();
