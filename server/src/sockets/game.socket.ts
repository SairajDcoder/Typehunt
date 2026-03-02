import { Server as SocketServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedSocket } from './index.js';
import { lobbyService } from '../services/lobby.service.js';
import { wordService } from '../services/word.service.js';
import { rankingService } from '../services/ranking.service.js';
import { anticheatService } from '../services/anticheat.service.js';
import { logger } from '../config/logger.js';
import { redis, RedisKeys } from '../config/redis.js';
import { GameState, PlayerProgress, LobbySettings } from '../types/index.js';
import { sleep } from '../utils/helpers.js';

const prisma = new PrismaClient();
const GAME_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes max game time

export function setupGameHandlers(io: SocketServer, socket: AuthenticatedSocket): void {
  const user = socket.user!;

  /**
   * Host starts the game
   */
  socket.on('game:start', async (data: { code: string }) => {
    try {
      const { code } = data;
      const upperCode = code.toUpperCase();

      // Verify host
      const lobbyData = await redis.hgetall(RedisKeys.lobby(upperCode));
      if (!lobbyData || lobbyData.hostId !== user.userId) {
        socket.emit('game:error', { message: 'Only the host can start the game' });
        return;
      }

      // Check all players are ready (except host)
      const players = await lobbyService.getLobbyPlayers(upperCode);
      const notReady = players.filter((p) => !p.isHost && !p.isReady);
      if (notReady.length > 0) {
        socket.emit('game:error', { message: 'Not all players are ready' });
        return;
      }

      if (players.length < 2) {
        socket.emit('game:error', { message: 'Need at least 2 players to start' });
        return;
      }

      // Update lobby status
      await lobbyService.setLobbyStatus(upperCode, 'IN_GAME');

      // Generate shared word set
      const settings: LobbySettings = JSON.parse(lobbyData.settings || '{}');
      const words = wordService.generateWords({
        count: settings.wordCount || 30,
        punctuation: settings.punctuation || false,
        numbers: settings.numbers || false,
        capitalization: settings.capitalization || false,
      });

      // Create match in database
      const match = await prisma.multiplayerMatch.create({
        data: {
          lobbyId: lobbyData.id,
          wordSet: words,
        },
      });

      // Create participant records
      await prisma.matchParticipant.createMany({
        data: players.map((p) => ({
          matchId: match.id,
          userId: p.userId,
        })),
      });

      // Initialize game state in Redis
      const playerProgress: Record<string, PlayerProgress> = {};
      for (const p of players) {
        playerProgress[p.userId] = {
          userId: p.userId,
          username: p.username,
          currentWordIndex: 0,
          correctWords: 0,
          totalKeystrokes: 0,
          correctKeystrokes: 0,
          wpm: 0,
          accuracy: 0,
          progress: 0,
          finished: false,
          keystrokeTimestamps: [],
        };
      }

      const gameState: GameState = {
        lobbyCode: upperCode,
        matchId: match.id,
        words,
        startTime: 0, // Set after countdown
        status: 'countdown',
        players: playerProgress,
      };

      await redis.set(
        RedisKeys.gameState(upperCode),
        JSON.stringify(gameState),
        'EX',
        600 // 10 min TTL
      );

      // Countdown sequence
      io.to(`lobby:${upperCode}`).emit('game:countdown', { count: 3 });
      await sleep(1000);
      io.to(`lobby:${upperCode}`).emit('game:countdown', { count: 2 });
      await sleep(1000);
      io.to(`lobby:${upperCode}`).emit('game:countdown', { count: 1 });
      await sleep(1000);

      // Start game
      gameState.startTime = Date.now();
      gameState.status = 'active';
      await redis.set(
        RedisKeys.gameState(upperCode),
        JSON.stringify(gameState),
        'EX',
        600
      );

      io.to(`lobby:${upperCode}`).emit('game:started', {
        matchId: match.id,
        words,
        startTime: gameState.startTime,
        players: players.map((p) => ({ userId: p.userId, username: p.username })),
      });

      // Set auto-end timeout
      setTimeout(async () => {
        await endGame(io, upperCode, 'timeout');
      }, GAME_TIMEOUT_MS);

      logger.info(`Game started in lobby ${upperCode} with ${players.length} players`);
    } catch (error: any) {
      logger.error(`Game start error: ${error.message}`);
      socket.emit('game:error', { message: error.message });
    }
  });

  /**
   * Player sends progress update
   */
  socket.on('game:progress', async (data: {
    code: string;
    currentWordIndex: number;
    correctWords: number;
    totalKeystrokes: number;
    correctKeystrokes: number;
    keystrokeTimestamp?: number;
  }) => {
    try {
      const { code, currentWordIndex, correctWords, totalKeystrokes, correctKeystrokes, keystrokeTimestamp } = data;
      const upperCode = code.toUpperCase();

      const stateJson = await redis.get(RedisKeys.gameState(upperCode));
      if (!stateJson) return;

      const gameState: GameState = JSON.parse(stateJson);
      if (gameState.status !== 'active') return;

      const playerProgress = gameState.players[user.userId];
      if (!playerProgress || playerProgress.finished) return;

      // Update progress
      playerProgress.currentWordIndex = currentWordIndex;
      playerProgress.correctWords = correctWords;
      playerProgress.totalKeystrokes = totalKeystrokes;
      playerProgress.correctKeystrokes = correctKeystrokes;
      playerProgress.progress = Math.round((currentWordIndex / gameState.words.length) * 100);

      // Record keystroke timestamp for anti-cheat
      if (keystrokeTimestamp) {
        playerProgress.keystrokeTimestamps.push(keystrokeTimestamp);
        playerProgress.lastKeystrokeAt = keystrokeTimestamp;
      }

      // Server-side WPM calculation
      const elapsed = (Date.now() - gameState.startTime) / 1000;
      if (elapsed > 0) {
        const chars = correctWords * 5; // approximate
        playerProgress.wpm = Math.round((chars / 5) / (elapsed / 60) * 100) / 100;
      }

      playerProgress.accuracy = totalKeystrokes > 0
        ? Math.round((correctKeystrokes / totalKeystrokes) * 10000) / 100
        : 0;

      // Check if player finished
      if (currentWordIndex >= gameState.words.length) {
        playerProgress.finished = true;
        playerProgress.finishedAt = Date.now();
        playerProgress.progress = 100;

        io.to(`lobby:${upperCode}`).emit('game:playerFinished', {
          userId: user.userId,
          username: user.username,
          wpm: playerProgress.wpm,
          accuracy: playerProgress.accuracy,
          finishTime: playerProgress.finishedAt - gameState.startTime,
        });
      }

      // Save updated state
      await redis.set(
        RedisKeys.gameState(upperCode),
        JSON.stringify(gameState),
        'EX',
        600
      );

      // Broadcast progress to all players
      const progressUpdate = Object.values(gameState.players).map((p) => ({
        userId: p.userId,
        username: p.username,
        wpm: p.wpm,
        accuracy: p.accuracy,
        progress: p.progress,
        finished: p.finished,
      }));

      io.to(`lobby:${upperCode}`).emit('game:progressUpdate', { players: progressUpdate });

      // Check if all players finished
      const allFinished = Object.values(gameState.players)
        .every((p) => p.finished || p.userId === '');

      if (allFinished) {
        await endGame(io, upperCode, 'complete');
      }
    } catch (error: any) {
      logger.error(`Game progress error: ${error.message}`);
    }
  });

  /**
   * Handle disconnect during game
   */
  socket.on('disconnect', async () => {
    const rooms = Array.from(socket.rooms).filter((r) => r.startsWith('lobby:'));

    for (const room of rooms) {
      const code = room.replace('lobby:', '');
      try {
        const stateJson = await redis.get(RedisKeys.gameState(code));
        if (!stateJson) continue;

        const gameState: GameState = JSON.parse(stateJson);
        if (gameState.status !== 'active') continue;

        const playerProgress = gameState.players[user.userId];
        if (playerProgress && !playerProgress.finished) {
          playerProgress.finished = true;
          playerProgress.finishedAt = Date.now();

          await redis.set(
            RedisKeys.gameState(code),
            JSON.stringify(gameState),
            'EX',
            600
          );

          io.to(room).emit('game:playerDisconnected', {
            userId: user.userId,
            username: user.username,
          });

          // Update DB
          await prisma.matchParticipant.updateMany({
            where: { matchId: gameState.matchId, userId: user.userId },
            data: { isDisconnected: true },
          });

          // Check if all remaining players finished
          const active = Object.values(gameState.players)
            .filter((p) => !p.finished);

          if (active.length === 0) {
            await endGame(io, code, 'complete');
          }
        }
      } catch {
        // Ignore cleanup errors
      }
    }
  });
}

/**
 * End the game, calculate results and Elo changes
 */
async function endGame(io: SocketServer, code: string, reason: string): Promise<void> {
  try {
    const stateJson = await redis.get(RedisKeys.gameState(code));
    if (!stateJson) return;

    const gameState: GameState = JSON.parse(stateJson);
    if (gameState.status === 'finished') return;

    gameState.status = 'finished';
    gameState.endTime = Date.now();

    // Rank players by progress then WPM
    const ranked = Object.values(gameState.players)
      .sort((a, b) => {
        if (a.finished && !b.finished) return -1;
        if (!a.finished && b.finished) return 1;
        if (a.progress !== b.progress) return b.progress - a.progress;
        return b.wpm - a.wpm;
      });

    const winnerId = ranked[0]?.userId;

    // Calculate Elo changes
    const eloPlayers = await Promise.all(
      ranked.map(async (p, i) => {
        const ranking = await prisma.ranking.findUnique({
          where: { userId: p.userId },
        });
        return {
          userId: p.userId,
          elo: ranking?.elo || 1000,
          position: i + 1,
        };
      })
    );

    const eloChanges = rankingService.calculateMultiplayerElo(eloPlayers);
    await rankingService.applyEloChanges(eloChanges, winnerId);

    // Update match in database
    await prisma.multiplayerMatch.update({
      where: { id: gameState.matchId },
      data: {
        endedAt: new Date(),
        winnerId,
      },
    });

    // Update participant records
    for (const player of ranked) {
      const eloChange = eloChanges.find((e) => e.userId === player.userId);
      await prisma.matchParticipant.updateMany({
        where: { matchId: gameState.matchId, userId: player.userId },
        data: {
          wpm: player.wpm,
          accuracy: player.accuracy,
          progress: player.progress,
          finishedAt: player.finishedAt ? new Date(player.finishedAt) : null,
          eloChange: eloChange?.change || 0,
        },
      });
    }

    // Broadcast final results
    const results = ranked.map((p, i) => {
      const eloChange = eloChanges.find((e) => e.userId === p.userId);
      return {
        position: i + 1,
        userId: p.userId,
        username: p.username,
        wpm: p.wpm,
        accuracy: p.accuracy,
        progress: p.progress,
        finished: p.finished,
        eloChange: eloChange?.change || 0,
        newElo: eloChange?.newElo || 1000,
      };
    });

    io.to(`lobby:${code}`).emit('game:ended', {
      reason,
      winnerId,
      winnerUsername: ranked[0]?.username,
      results,
      duration: gameState.endTime - gameState.startTime,
    });

    // Update lobby status
    await lobbyService.setLobbyStatus(code, 'FINISHED');

    // Clean up game state after a delay
    setTimeout(async () => {
      await redis.del(RedisKeys.gameState(code));
    }, 30000);

    logger.info(`Game ended in lobby ${code}. Winner: ${ranked[0]?.username}`);
  } catch (error: any) {
    logger.error(`End game error: ${error.message}`);
  }
}
