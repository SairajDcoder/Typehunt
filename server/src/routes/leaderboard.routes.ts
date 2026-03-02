import { Router } from 'express';
import { leaderboardController } from '../controllers/leaderboard.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = Router();

/**
 * @swagger
 * /leaderboard:
 *   get:
 *     tags: [Leaderboard]
 *     summary: Get global leaderboard
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Paginated leaderboard
 */
router.get('/', (req, res, next) => leaderboardController.getLeaderboard(req, res, next));

/**
 * @swagger
 * /leaderboard/top:
 *   get:
 *     tags: [Leaderboard]
 *     summary: Get top 10 players
 *     responses:
 *       200:
 *         description: Top 10 players by Elo
 */
router.get('/top', (req, res, next) => leaderboardController.getTopPlayers(req, res, next));

/**
 * @swagger
 * /leaderboard/me:
 *   get:
 *     tags: [Leaderboard]
 *     summary: Get current user's rank
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's rank, Elo, wins, and losses
 */
router.get('/me', authenticate, (req, res, next) => leaderboardController.getMyRank(req, res, next));

export default router;
