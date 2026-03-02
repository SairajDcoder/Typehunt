import { PrismaClient } from '@prisma/client';
import { EloChange } from '../types/index.js';

const prisma = new PrismaClient();

const K_FACTOR = 32; // Standard Elo K-factor
const DEFAULT_ELO = 1000;

export class RankingService {
  /**
   * Calculate expected probability of player A winning against player B
   */
  private expectedScore(ratingA: number, ratingB: number): number {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  }

  /**
   * Calculate Elo changes for a 1v1 match
   */
  calculateElo1v1(winnerElo: number, loserElo: number): { winnerChange: number; loserChange: number } {
    const expectedWinner = this.expectedScore(winnerElo, loserElo);
    const expectedLoser = this.expectedScore(loserElo, winnerElo);

    const winnerChange = Math.round(K_FACTOR * (1 - expectedWinner));
    const loserChange = Math.round(K_FACTOR * (0 - expectedLoser));

    return { winnerChange, loserChange };
  }

  /**
   * Calculate Elo changes for a multiplayer match based on finishing positions
   * Each pair of players is compared, and Elo changes are accumulated
   */
  calculateMultiplayerElo(
    players: { userId: string; elo: number; position: number }[]
  ): EloChange[] {
    const changes: Record<string, number> = {};

    // Initialize changes
    for (const player of players) {
      changes[player.userId] = 0;
    }

    // Compare each pair
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const playerA = players[i];
        const playerB = players[j];

        // Lower position = better (1st place = position 1)
        const aWon = playerA.position < playerB.position;

        const expected = this.expectedScore(playerA.elo, playerB.elo);
        const actual = aWon ? 1 : 0;

        // Scale K-factor by number of opponents
        const scaledK = K_FACTOR / (players.length - 1);

        const change = Math.round(scaledK * (actual - expected));
        changes[playerA.userId] += change;
        changes[playerB.userId] -= change;
      }
    }

    return players.map((p) => ({
      userId: p.userId,
      oldElo: p.elo,
      newElo: p.elo + changes[p.userId],
      change: changes[p.userId],
    }));
  }

  /**
   * Apply Elo changes to the database
   */
  async applyEloChanges(eloChanges: EloChange[], winnerId?: string): Promise<void> {
    const updates = eloChanges.map((change) =>
      prisma.ranking.upsert({
        where: { userId: change.userId },
        update: {
          elo: Math.max(0, change.newElo), // Elo can't go below 0
          gamesPlayed: { increment: 1 },
          ...(change.change > 0 ? { wins: { increment: 1 } } : { losses: { increment: 1 } }),
        },
        create: {
          userId: change.userId,
          elo: Math.max(0, change.newElo),
          gamesPlayed: 1,
          wins: change.change > 0 ? 1 : 0,
          losses: change.change <= 0 ? 1 : 0,
        },
      })
    );

    await prisma.$transaction(updates);
  }

  /**
   * Get global leaderboard
   */
  async getLeaderboard(limit = 50, offset = 0) {
    const [rankings, total] = await Promise.all([
      prisma.ranking.findMany({
        orderBy: { elo: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: { id: true, username: true, avatarUrl: true },
          },
        },
      }),
      prisma.ranking.count(),
    ]);

    return {
      rankings: rankings.map((r, i) => ({
        rank: offset + i + 1,
        userId: r.userId,
        username: r.user.username,
        avatarUrl: r.user.avatarUrl,
        elo: r.elo,
        wins: r.wins,
        losses: r.losses,
        gamesPlayed: r.gamesPlayed,
      })),
      total,
      limit,
      offset,
    };
  }

  /**
   * Get top N players
   */
  async getTopPlayers(limit = 10) {
    return this.getLeaderboard(limit, 0);
  }

  /**
   * Get a user's rank
   */
  async getUserRank(userId: string) {
    const userRanking = await prisma.ranking.findUnique({
      where: { userId },
      include: {
        user: {
          select: { username: true, avatarUrl: true },
        },
      },
    });

    if (!userRanking) {
      return { rank: null, elo: DEFAULT_ELO, wins: 0, losses: 0, gamesPlayed: 0 };
    }

    // Count how many players have higher Elo
    const higherCount = await prisma.ranking.count({
      where: { elo: { gt: userRanking.elo } },
    });

    return {
      rank: higherCount + 1,
      elo: userRanking.elo,
      wins: userRanking.wins,
      losses: userRanking.losses,
      gamesPlayed: userRanking.gamesPlayed,
      username: userRanking.user.username,
    };
  }
}

export const rankingService = new RankingService();
