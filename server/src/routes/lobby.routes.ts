import { Router } from 'express';
import { lobbyController } from '../controllers/lobby.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/**
 * @swagger
 * /lobby/create:
 *   post:
 *     tags: [Lobby]
 *     summary: Create a new lobby
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               settings:
 *                 type: object
 *                 properties:
 *                   wordCount:
 *                     type: integer
 *                     default: 30
 *                   punctuation:
 *                     type: boolean
 *                     default: false
 *                   numbers:
 *                     type: boolean
 *                     default: false
 *                   capitalization:
 *                     type: boolean
 *                     default: false
 *               playerLimit:
 *                 type: integer
 *                 default: 8
 *                 minimum: 2
 *                 maximum: 16
 *     responses:
 *       201:
 *         description: Lobby created with unique code
 */
router.post('/create', authenticate, (req, res, next) => lobbyController.createLobby(req, res, next));

/**
 * @swagger
 * /lobby/{code}:
 *   get:
 *     tags: [Lobby]
 *     summary: Get lobby information
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: 6-character lobby code
 *     responses:
 *       200:
 *         description: Lobby details with player list
 *       404:
 *         description: Lobby not found
 */
router.get('/:code', authenticate, (req, res, next) => lobbyController.getLobbyInfo(req, res, next));

/**
 * @swagger
 * /lobby/{code}/join:
 *   post:
 *     tags: [Lobby]
 *     summary: Join a lobby via code
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Joined lobby successfully
 *       400:
 *         description: Lobby full or game in progress
 */
router.post('/:code/join', authenticate, (req, res, next) => lobbyController.joinLobby(req, res, next));

/**
 * @swagger
 * /lobby/{code}/settings:
 *   put:
 *     tags: [Lobby]
 *     summary: Update lobby settings (host only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               wordCount:
 *                 type: integer
 *               punctuation:
 *                 type: boolean
 *               numbers:
 *                 type: boolean
 *               capitalization:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Settings updated
 *       403:
 *         description: Only host can update settings
 */
router.put('/:code/settings', authenticate, (req, res, next) => lobbyController.updateSettings(req, res, next));

export default router;
