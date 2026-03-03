import { Router } from 'express';
import { gameController } from '../controllers/game.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { gameLimiter } from '../middleware/rateLimiter.js';

const router = Router();

/**
 * @swagger
 * /game/words:
 *   get:
 *     tags: [Game]
 *     summary: Generate a word set for typing
 *     parameters:
 *       - in: query
 *         name: count
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of words (5-200)
 *       - in: query
 *         name: punctuation
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include punctuation
 *       - in: query
 *         name: numbers
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include numbers
 *       - in: query
 *         name: caps
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include capitalization
 *     responses:
 *       200:
 *         description: Generated word set
 */
router.get('/words', (req, res, next) => gameController.generateWords(req, res, next));

// Public stats endpoint for landing page
router.get('/stats', (req, res, next) => gameController.getLiveStats(req, res, next));

/**
 * @swagger
 * /game/submit:
 *   post:
 *     tags: [Game]
 *     summary: Submit singleplayer game result
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [wordSet, typedWords, startTime, endTime]
 *             properties:
 *               wordSet:
 *                 type: array
 *                 items:
 *                   type: string
 *               typedWords:
 *                 type: array
 *                 items:
 *                   type: string
 *               startTime:
 *                 type: number
 *               endTime:
 *                 type: number
 *               keystrokeTimestamps:
 *                 type: array
 *                 items:
 *                   type: number
 *     responses:
 *       200:
 *         description: Game result with WPM, accuracy, and time
 */
router.post('/submit', authenticate, gameLimiter, (req, res, next) => gameController.submitSingleplayer(req, res, next));

/**
 * @swagger
 * /game/hardcore/submit:
 *   post:
 *     tags: [Game]
 *     summary: Submit hardcore mode result (fails on first wrong word)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [wordSet, typedWords, startTime, endTime]
 *             properties:
 *               wordSet:
 *                 type: array
 *                 items:
 *                   type: string
 *               typedWords:
 *                 type: array
 *                 items:
 *                   type: string
 *               startTime:
 *                 type: number
 *               endTime:
 *                 type: number
 *     responses:
 *       200:
 *         description: Hardcore result (success/failure with details)
 */
router.post('/hardcore/submit', authenticate, gameLimiter, (req, res, next) => gameController.submitHardcore(req, res, next));

/**
 * @swagger
 * /game/hardcore/highscores:
 *   get:
 *     tags: [Game]
 *     summary: Get hardcore mode high scores
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of top hardcore scores
 */
router.get('/hardcore/highscores', (req, res, next) => gameController.getHardcoreHighscores(req, res, next));

/**
 * @swagger
 * /game/history:
 *   get:
 *     tags: [Game]
 *     summary: Get user's game history
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Paginated game history
 */
router.get('/history', authenticate, (req, res, next) => gameController.getGameHistory(req, res, next));

export default router;
