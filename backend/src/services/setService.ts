import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface PlayerScore {
  userId: string;
  gamesWon: number;
}

interface CreateSetData {
  courtId: string;
  setNumber: number;
  scores: PlayerScore[]; // Array of player IDs and their games won
  createdById: string;
}

interface UpdateSetData {
  scores?: PlayerScore[];
}

export const setService = {
  async createSet(data: CreateSetData) {
    // Validate that we have scores
    if (!data.scores || data.scores.length === 0) {
      throw new Error('At least one player score is required');
    }

    // Create the set with all scores in a transaction
    const set = await prisma.set.create({
      data: {
        courtId: data.courtId,
        setNumber: data.setNumber,
        createdById: data.createdById,
        scores: {
          create: data.scores.map((score) => ({
            userId: score.userId,
            gamesWon: score.gamesWon,
          })),
        },
      },
      include: {
        court: {
          include: {
            session: true,
          },
        },
        scores: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return set;
  },

  async getSetsBySession(sessionId: string) {
    const sets = await prisma.set.findMany({
      where: {
        court: {
          sessionId: sessionId,
        },
      },
      include: {
        court: true,
        scores: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            gamesWon: 'desc', // Order by score for easier reading
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { court: { courtNumber: 'asc' } },
        { setNumber: 'asc' },
      ],
    });

    return sets;
  },

  async getSetById(setId: string) {
    const set = await prisma.set.findUnique({
      where: { id: setId },
      include: {
        court: {
          include: {
            session: true,
          },
        },
        scores: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!set) {
      throw new Error('Set not found');
    }

    return set;
  },

  async updateSet(setId: string, userId: string, data: UpdateSetData) {
    // Get the set to check permissions
    const set = await prisma.set.findUnique({
      where: { id: setId },
    });

    if (!set) {
      throw new Error('Set not found');
    }

    // Fetch requesting user to check admin status
    const requestingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    // Only the creator or admin can update the set
    if (set.createdById !== userId && !requestingUser?.isAdmin) {
      throw new Error('Only the set creator or admin can update this set');
    }

    // If scores are being updated, delete old scores and create new ones
    if (data.scores) {
      await prisma.$transaction([
        // Delete existing scores
        prisma.setScore.deleteMany({
          where: { setId },
        }),
        // Create new scores
        prisma.setScore.createMany({
          data: data.scores.map((score) => ({
            setId,
            userId: score.userId,
            gamesWon: score.gamesWon,
          })),
        }),
      ]);
    }

    // Fetch updated set
    const updatedSet = await prisma.set.findUnique({
      where: { id: setId },
      include: {
        court: true,
        scores: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return updatedSet;
  },

  async deleteSet(setId: string, userId: string) {
    // Get the set to check permissions
    const set = await prisma.set.findUnique({
      where: { id: setId },
    });

    if (!set) {
      throw new Error('Set not found');
    }

    // Fetch requesting user to check admin status
    const requestingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    // Only the creator or admin can delete the set
    if (set.createdById !== userId && !requestingUser?.isAdmin) {
      throw new Error('Only the set creator or admin can delete this set');
    }

    await prisma.set.delete({
      where: { id: setId },
    });

    return { message: 'Set deleted successfully' };
  },

  async getPlayerStats(userId: string) {
    // Get all set scores for this user
    const userScores = await prisma.setScore.findMany({
      where: { userId },
      include: {
        set: {
          include: {
            scores: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    let setsWon = 0;
    let setsLost = 0;
    let gamesWon = 0;
    let gamesLost = 0;
    const totalSets = userScores.length;

    userScores.forEach((userScore) => {
      const set = userScore.set;
      const allScores = set.scores;

      // Get user's games won
      const userGamesWon = userScore.gamesWon;
      gamesWon += userGamesWon;

      // Find the highest score in this set (winner)
      const maxScore = Math.max(...allScores.map((s) => s.gamesWon));

      // For games lost, find the highest opponent score (not sum of all opponents)
      // Assumes typical 2v2: you + partner have same score vs opponents with same score
      const otherScores = allScores.filter((s) => s.userId !== userId);
      const maxOpponentScore = otherScores.length > 0 
        ? Math.max(...otherScores.map((s) => s.gamesWon))
        : 0;
      gamesLost += maxOpponentScore;

      // Determine if user won this set
      // A set is won if the user has the highest score AND reached at least 6 games
      if (userGamesWon === maxScore && userGamesWon >= 6) {
        setsWon++;
      } else if (maxScore >= 6) {
        // Someone else won with 6+ games
        setsLost++;
      }
    });

    const totalGames = gamesWon + gamesLost;
    const setWinRate = totalSets > 0 ? (setsWon / totalSets) * 100 : 0;
    const gameWinRate = totalGames > 0 ? (gamesWon / totalGames) * 100 : 0;

    return {
      totalSets,
      setsWon,
      setsLost,
      gamesWon,
      gamesLost,
      totalGames,
      setWinRate: Math.round(setWinRate * 10) / 10,
      gameWinRate: Math.round(gameWinRate * 10) / 10,
    };
  },

  async getLeaderboard() {
    // Get all set scores
    const allScores = await prisma.setScore.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        set: {
          include: {
            scores: true,
          },
        },
      },
    });

    // Group by user
    const playerStatsMap = new Map<string, {
      userId: string;
      userName: string;
      userAvatar: string | null;
      totalSets: number;
      setsWon: number;
      setsLost: number;
      gamesWon: number;
      gamesLost: number;
    }>();

    allScores.forEach((score) => {
      const userId = score.userId;
      const userName = score.user.name;
      const userAvatar = score.user.avatarUrl;

      const existing = playerStatsMap.get(userId) || {
        userId,
        userName,
        userAvatar,
        totalSets: 0,
        setsWon: 0,
        setsLost: 0,
        gamesWon: 0,
        gamesLost: 0,
      };

      existing.totalSets++;
      existing.gamesWon += score.gamesWon;

      // Find max score in this set
      const maxScore = Math.max(...score.set.scores.map((s) => s.gamesWon));

      // For games lost, find the highest opponent score (not sum of all opponents)
      const otherScores = score.set.scores.filter((s) => s.userId !== userId);
      const maxOpponentScore = otherScores.length > 0 
        ? Math.max(...otherScores.map((s) => s.gamesWon))
        : 0;
      existing.gamesLost += maxOpponentScore;

      // Determine if won this set
      if (score.gamesWon === maxScore && score.gamesWon >= 6) {
        existing.setsWon++;
      } else if (maxScore >= 6) {
        existing.setsLost++;
      }

      playerStatsMap.set(userId, existing);
    });

    // Convert to array and calculate win rates
    const leaderboard = Array.from(playerStatsMap.values())
      .filter((stats) => {
        // Exclude Guest Player placeholder
        return stats.userName !== 'Guest Player';
      })
      .map((stats) => {
        const totalGames = stats.gamesWon + stats.gamesLost;
        const setWinRate = stats.totalSets > 0 ? (stats.setsWon / stats.totalSets) * 100 : 0;
        const gameWinRate = totalGames > 0 ? (stats.gamesWon / totalGames) * 100 : 0;

        return {
          ...stats,
          totalGames,
          setWinRate: Math.round(setWinRate * 10) / 10,
          gameWinRate: Math.round(gameWinRate * 10) / 10,
        };
      })
      .sort((a, b) => {
        // Sort by set win rate first
        if (b.setWinRate !== a.setWinRate) {
          return b.setWinRate - a.setWinRate;
        }
        // If equal, sort by total sets
        return b.totalSets - a.totalSets;
      });

    return leaderboard;
  },

  async getSetHistoryForUser(userId: string) {
    const sets = await prisma.set.findMany({
      where: {
        scores: {
          some: {
            userId,
          },
        },
      },
      include: {
        court: {
          include: {
            session: true,
          },
        },
        scores: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            gamesWon: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return sets.map((set) => {
      // Find max score (winner)
      const maxScore = Math.max(...set.scores.map((s) => s.gamesWon));
      const userScore = set.scores.find((s) => s.userId === userId);
      const playerWon = userScore && userScore.gamesWon === maxScore && userScore.gamesWon >= 6;

      return {
        id: set.id,
        setNumber: set.setNumber,
        date: set.court.session.date,
        sessionId: set.court.session.id,
        venueName: set.court.session.venueName,
        courtNumber: set.court.courtNumber,
        scores: set.scores,
        playerWon,
        maxScore,
      };
    });
  },
};

