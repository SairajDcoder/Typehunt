import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { redis, RedisKeys } from '../config/redis.js';
import { lobbyService } from '../services/lobby.service.js';
import { AuthRequest } from '../types/index.js';
import { createAppError } from '../middleware/errorHandler.js';

const prisma = new PrismaClient();

export class AdminController {
  async banUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { reason } = req.body;

      const user = await prisma.user.update({
        where: { id },
        data: { isBanned: true, banReason: reason || 'No reason provided' },
        select: { id: true, username: true, email: true, isBanned: true, banReason: true },
      });

      res.json({ success: true, data: user, message: `User ${user.username} banned` });
    } catch (error) {
      next(error);
    }
  }

  async unbanUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      const user = await prisma.user.update({
        where: { id },
        data: { isBanned: false, banReason: null },
        select: { id: true, username: true, email: true, isBanned: true },
      });

      res.json({ success: true, data: user, message: `User ${user.username} unbanned` });
    } catch (error) {
      next(error);
    }
  }

  async listActiveLobbies(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const lobbies = await prisma.lobby.findMany({
        where: { status: { in: ['WAITING', 'IN_GAME'] } },
        orderBy: { createdAt: 'desc' },
        include: {
          host: {
            select: { id: true, username: true },
          },
        },
      });

      // Enrich with Redis player counts
      const enriched = await Promise.all(
        lobbies.map(async (lobby) => {
          const players = await lobbyService.getLobbyPlayers(lobby.code);
          return {
            ...lobby,
            playerCount: players.length,
          };
        })
      );

      res.json({ success: true, data: enriched });
    } catch (error) {
      next(error);
    }
  }

  async closeLobby(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const code = req.params.code as string;
      await lobbyService.closeLobby(code.toUpperCase());
      res.json({ success: true, message: `Lobby ${code} closed` });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
