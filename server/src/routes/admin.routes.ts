import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

/**
 * @swagger
 * /admin/users/{id}/ban:
 *   post:
 *     tags: [Admin]
 *     summary: Ban a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: User banned
 *       403:
 *         description: Admin access required
 */
router.post('/users/:id/ban', (req, res, next) => adminController.banUser(req, res, next));

/**
 * @swagger
 * /admin/users/{id}/unban:
 *   post:
 *     tags: [Admin]
 *     summary: Unban a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User unbanned
 */
router.post('/users/:id/unban', (req, res, next) => adminController.unbanUser(req, res, next));

/**
 * @swagger
 * /admin/lobbies:
 *   get:
 *     tags: [Admin]
 *     summary: List all active lobbies
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active lobbies with player counts
 */
router.get('/lobbies', (req, res, next) => adminController.listActiveLobbies(req, res, next));

/**
 * @swagger
 * /admin/lobbies/{code}/close:
 *   delete:
 *     tags: [Admin]
 *     summary: Force-close a lobby
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
 *         description: Lobby closed
 */
router.delete('/lobbies/:code/close', (req, res, next) => adminController.closeLobby(req, res, next));

export default router;
