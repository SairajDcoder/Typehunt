import { PrismaClient } from '@prisma/client';
import { calculateWPM, calculateAccuracy } from '../utils/helpers.js';
import { createAppError } from '../middleware/errorHandler.js';
import { anticheatService } from './anticheat.service.js';
import { GameSubmission } from '../types/index.js';

const prisma = new PrismaClient();

export class GameService {
  async submitSingleplayer(userId: string, submission: GameSubmission) {
    const { wordSet, typedWords, startTime, endTime, keystrokeTimestamps, subMode } = submission;

    // Anti-cheat validation
    const timeTaken = (endTime - startTime) / 1000; // seconds
    anticheatService.validateTimingBasic(timeTaken, typedWords.length);

    if (keystrokeTimestamps && keystrokeTimestamps.length > 0) {
      anticheatService.validateKeystrokeTimings(keystrokeTimestamps);
    }

    // Calculate correct characters
    let correctChars = 0;
    let correctWords = 0;
    let totalChars = 0;

    for (let i = 0; i < typedWords.length; i++) {
      const expected = wordSet[i] || '';
      const typed = typedWords[i] || '';
      totalChars += typed.length;

      if (typed === expected) {
        correctChars += typed.length + 1; // +1 for space
        correctWords++;
      } else {
        // Count matching characters
        for (let j = 0; j < Math.min(typed.length, expected.length); j++) {
          if (typed[j] === expected[j]) correctChars++;
        }
      }
    }

    const wpm = calculateWPM(correctChars, timeTaken);
    const accuracy = calculateAccuracy(correctWords, typedWords.length);

    anticheatService.validateWPM(wpm);

    const result = await prisma.gameResult.create({
      data: {
        userId,
        mode: 'SINGLE',
        subMode: subMode || 'words',
        wpm,
        accuracy,
        timeTaken,
        wordCount: wordSet.length,
        rawInput: typedWords.join(' '),
        wordSet: JSON.stringify(wordSet),
      },
    });

    return {
      id: result.id,
      wpm,
      accuracy,
      timeTaken,
      correctWords,
      totalWords: wordSet.length,
    };
  }

  async submitHardcore(userId: string, submission: GameSubmission) {
    const { wordSet, typedWords, startTime, endTime, keystrokeTimestamps } = submission;

    const timeTaken = (endTime - startTime) / 1000;
    anticheatService.validateTimingBasic(timeTaken, typedWords.length);

    if (keystrokeTimestamps && keystrokeTimestamps.length > 0) {
      anticheatService.validateKeystrokeTimings(keystrokeTimestamps);
    }

    // In hardcore mode, check if any word is wrong
    let failedAtWord = -1;
    for (let i = 0; i < typedWords.length; i++) {
      if (typedWords[i] !== wordSet[i]) {
        failedAtWord = i;
        break;
      }
    }

    if (failedAtWord >= 0) {
      return {
        success: false,
        failedAtWord,
        expected: wordSet[failedAtWord],
        typed: typedWords[failedAtWord],
        wordsCompleted: failedAtWord,
      };
    }

    const correctChars = typedWords.reduce((sum, word) => sum + word.length + 1, 0);
    const wpm = calculateWPM(correctChars, timeTaken);
    const accuracy = 100; // Perfect in hardcore

    anticheatService.validateWPM(wpm);

    const result = await prisma.gameResult.create({
      data: {
        userId,
        mode: 'HARDCORE',
        wpm,
        accuracy,
        timeTaken,
        wordCount: typedWords.length,
        rawInput: typedWords.join(' '),
        wordSet: JSON.stringify(wordSet),
      },
    });

    return {
      success: true,
      id: result.id,
      wpm,
      accuracy,
      timeTaken,
      wordsCompleted: typedWords.length,
    };
  }

  async getHardcoreHighscores(limit = 20) {
    return prisma.gameResult.findMany({
      where: { mode: 'HARDCORE' },
      orderBy: { wpm: 'desc' },
      take: limit,
      select: {
        id: true,
        wpm: true,
        accuracy: true,
        timeTaken: true,
        wordCount: true,
        createdAt: true,
        user: {
          select: { id: true, username: true, avatarUrl: true },
        },
      },
    });
  }

  async getGameHistory(userId: string, limit = 20, offset = 0) {
    const [results, total] = await Promise.all([
      prisma.gameResult.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          mode: true,
          wpm: true,
          accuracy: true,
          timeTaken: true,
          wordCount: true,
          createdAt: true,
        },
      }),
      prisma.gameResult.count({ where: { userId } }),
    ]);

    return { results, total, limit, offset };
  }
}

export const gameService = new GameService();
