import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';
import { AuthPayload } from '../types/index.js';
import { createAppError } from '../middleware/errorHandler.js';

const prisma = new PrismaClient();
const googleClient = env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(env.GOOGLE_CLIENT_ID)
  : null;

export class AuthService {
  async register(email: string, username: string, password: string) {
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw createAppError('Email already registered', 409);
      }
      throw createAppError('Username already taken', 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { email, username, passwordHash },
      select: { id: true, email: true, username: true, avatarUrl: true, createdAt: true },
    });

    // Create initial ranking
    await prisma.ranking.create({
      data: { userId: user.id },
    });

    const token = this.generateToken(user.id, email, username, false);

    return { user, token };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      throw createAppError('Invalid credentials', 401);
    }

    if (user.isBanned) {
      throw createAppError(`Account banned: ${user.banReason || 'No reason provided'}`, 403);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw createAppError('Invalid credentials', 401);
    }

    const token = this.generateToken(user.id, user.email, user.username, user.isAdmin);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  async googleAuth(idToken: string) {
    if (!googleClient) {
      throw createAppError('Google OAuth not configured', 501);
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw createAppError('Invalid Google token', 401);
    }

    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId: payload.sub }, { email: payload.email }] },
    });

    if (!user) {
      // Generate a unique username from email
      let username = payload.email.split('@')[0];
      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing) {
        username = `${username}${Math.floor(Math.random() * 9999)}`;
      }

      user = await prisma.user.create({
        data: {
          email: payload.email,
          username,
          googleId: payload.sub,
          avatarUrl: payload.picture,
        },
      });

      await prisma.ranking.create({
        data: { userId: user.id },
      });
    } else if (!user.googleId) {
      // Link Google account to existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: payload.sub, avatarUrl: user.avatarUrl || payload.picture },
      });
    }

    if (user.isBanned) {
      throw createAppError(`Account banned: ${user.banReason || 'No reason provided'}`, 403);
    }

    const token = this.generateToken(user.id, user.email, user.username, user.isAdmin);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, username: true, avatarUrl: true, createdAt: true, isAdmin: true,
        ranking: {
          select: { elo: true, wins: true, losses: true, gamesPlayed: true },
        },
      },
    });

    if (!user) throw createAppError('User not found', 404);
    return user;
  }

  async getStats(userId: string) {
    const [singleplayerStats, hardcoreStats, multiplayerStats] = await Promise.all([
      prisma.gameResult.aggregate({
        where: { userId, mode: 'SINGLE' },
        _avg: { wpm: true, accuracy: true },
        _max: { wpm: true },
        _count: true,
      }),
      prisma.gameResult.aggregate({
        where: { userId, mode: 'HARDCORE' },
        _avg: { wpm: true, accuracy: true },
        _max: { wpm: true },
        _count: true,
      }),
      prisma.matchParticipant.aggregate({
        where: { userId },
        _avg: { wpm: true, accuracy: true },
        _count: true,
      }),
    ]);

    const ranking = await prisma.ranking.findUnique({
      where: { userId },
    });

    return {
      singleplayer: {
        gamesPlayed: singleplayerStats._count,
        avgWpm: Math.round((singleplayerStats._avg.wpm || 0) * 100) / 100,
        avgAccuracy: Math.round((singleplayerStats._avg.accuracy || 0) * 100) / 100,
        bestWpm: singleplayerStats._max.wpm || 0,
      },
      hardcore: {
        gamesPlayed: hardcoreStats._count,
        avgWpm: Math.round((hardcoreStats._avg.wpm || 0) * 100) / 100,
        avgAccuracy: Math.round((hardcoreStats._avg.accuracy || 0) * 100) / 100,
        bestWpm: hardcoreStats._max.wpm || 0,
      },
      multiplayer: {
        gamesPlayed: multiplayerStats._count,
        avgWpm: Math.round((multiplayerStats._avg.wpm || 0) * 100) / 100,
      },
      ranking: ranking
        ? { elo: ranking.elo, wins: ranking.wins, losses: ranking.losses }
        : null,
    };
  }

  private generateToken(userId: string, email: string, username: string, isAdmin: boolean): string {
    const payload: AuthPayload = { userId, email, username, isAdmin };
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }
}

export const authService = new AuthService();
