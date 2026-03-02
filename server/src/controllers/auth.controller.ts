import { Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { AuthRequest } from '../types/index.js';

export class AuthController {
  async register(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, username, password } = req.body;
      const result = await authService.register(email, username, password);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async googleAuth(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { idToken } = req.body;
      const result = await authService.googleAuth(idToken);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await authService.getProfile(req.user!.userId);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await authService.getStats(req.user!.userId);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
