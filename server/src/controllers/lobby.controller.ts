import { Response, NextFunction } from 'express';
import { lobbyService } from '../services/lobby.service.js';
import { AuthRequest } from '../types/index.js';

export class LobbyController {
  async createLobby(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { settings, playerLimit } = req.body;
      const lobby = await lobbyService.createLobby(
        req.user!.userId,
        req.user!.username,
        settings,
        playerLimit
      );
      res.status(201).json({ success: true, data: lobby });
    } catch (error) {
      next(error);
    }
  }

  async getLobbyInfo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const code = req.params.code as string;
      const lobby = await lobbyService.getLobbyInfo(code.toUpperCase());
      res.json({ success: true, data: lobby });
    } catch (error) {
      next(error);
    }
  }

  async joinLobby(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const code = req.params.code as string;
      const result = await lobbyService.joinLobby(
        code.toUpperCase(),
        req.user!.userId,
        req.user!.username
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const code = req.params.code as string;
      const settings = await lobbyService.updateSettings(
        code.toUpperCase(),
        req.user!.userId,
        req.body
      );
      res.json({ success: true, data: { settings } });
    } catch (error) {
      next(error);
    }
  }
}

export const lobbyController = new LobbyController();
