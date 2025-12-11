import { PrismaClient } from '@prisma/client';
import { recalculateRatingsForSet } from './ratingService';

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

    // For each playerId, check if it's a user or a guest
    const scoreDataWithPlayerType = await Promise.all(
      data.scores.map(async (score) => {
        // First check if it's a user
        const user = await prisma.user.findUnique({
          where: { id: score.userId },
        });
        
        if (user) {
          return {
            userId: score.userId,
            guestId: null,
            gamesWon: score.gamesWon,
          };
        }
        
        // If not a user, check if it's a guest
        const guest = await prisma.guest.findUnique({
          where: { id: score.userId },
        });
        
        if (guest) {
          return {
            userId: null,
            guestId: score.userId,
            gamesWon: score.gamesWon,
          };
        }
        
        throw new Error(`Player with ID ${score.userId} not found as user or guest`);
      })
    );

    // Create the set with all scores in a transaction
    const set = await prisma.set.create({
      data: {
        courtId: data.courtId,
        setNumber: data.setNumber,
        createdById: data.createdById,
        scores: {
          create: scoreDataWithPlayerType,
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
            guest: {
              select: {
                id: true,
                name: true,
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

    // Recalculate ratings for all players in this set (async, don't wait)
    recalculateRatingsForSet(set.id).catch((error) => {
      console.error('Error recalculating ratings after set creation:', error);
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
            guest: {
              select: {
                id: true,
                name: true,
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
            guest: {
              select: {
                id: true,
                name: true,
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
      // For each playerId, check if it's a user or a guest
      const scoreDataWithPlayerType = await Promise.all(
        data.scores.map(async (score) => {
          // First check if it's a user
          const user = await prisma.user.findUnique({
            where: { id: score.userId },
          });
          
          if (user) {
            return {
              setId,
              userId: score.userId,
              guestId: null,
              gamesWon: score.gamesWon,
            };
          }
          
          // If not a user, check if it's a guest
          const guest = await prisma.guest.findUnique({
            where: { id: score.userId },
          });
          
          if (guest) {
            return {
              setId,
              userId: null,
              guestId: score.userId,
              gamesWon: score.gamesWon,
            };
          }
          
          throw new Error(`Player with ID ${score.userId} not found as user or guest`);
        })
      );

      await prisma.$transaction([
        // Delete existing scores
        prisma.setScore.deleteMany({
          where: { setId },
        }),
        // Create new scores
        prisma.setScore.createMany({
          data: scoreDataWithPlayerType,
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
            guest: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Recalculate ratings for all players in this set (async, don't wait)
    recalculateRatingsForSet(setId).catch((error) => {
      console.error('Error recalculating ratings after set update:', error);
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

    // Get affected user IDs before deleting
    const affectedScores = await prisma.setScore.findMany({
      where: { setId },
      select: { userId: true },
    });
    const affectedUserIds = Array.from(
      new Set(
        affectedScores
          .map((s) => s.userId)
          .filter((id): id is string => id !== null)
      )
    );

    await prisma.set.delete({
      where: { id: setId },
    });

    // Recalculate ratings for all affected players (async, don't wait)
    // Note: We need to recalculate each player individually since the set is already deleted
    Promise.all(
      affectedUserIds.map((userId) =>
        import('./ratingService').then(({ recalculatePlayerRating }) =>
          recalculatePlayerRating(userId).catch((error) => {
            console.error(`Error recalculating rating for user ${userId} after set deletion:`, error);
          })
        )
      )
    ).catch((error) => {
      console.error('Error recalculating ratings after set deletion:', error);
    });

    return { message: 'Set deleted successfully' };
  },

  async getPlayerStats(userId: string) {
    // Get user with rating
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { rating: true },
    });

    // Get all set scores for this user
    const userScores = await prisma.setScore.findMany({
      where: { userId },
      include: {
        set: {
          include: {
            scores: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                  },
                },
                guest: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
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

    // Map to track teammate stats: teammateId -> { gamesWon, gamesLost, totalGames }
    const teammateStatsMap = new Map<string, {
      teammateId: string;
      teammateName: string;
      teammateAvatar: string | null;
      gamesWon: number;
      gamesLost: number;
      totalGames: number;
    }>();

    userScores.forEach((userScore) => {
      const set = userScore.set;
      const allScores = set.scores;

      // Get user's games won
      const userGamesWon = userScore.gamesWon;
      gamesWon += userGamesWon;

      // Find the highest score in this set (winner)
      const maxScore = Math.max(...allScores.map((s) => s.gamesWon));

      // Find teammate (the other player with the same score)
      // Only count registered users as teammates (not guests)
      const teammateScore = allScores.find((s) => 
        s.userId !== userId && 
        s.userId !== null && 
        s.gamesWon === userGamesWon
      );

      // For games lost, find the highest opponent score (excluding teammate)
      // Assumes typical 2v2: you + partner have same score vs opponents with same score
      const opponentScores = allScores.filter((s) => 
        s.userId !== userId && 
        s.gamesWon !== userGamesWon  // Exclude teammate (who has same score)
      );
      const maxOpponentScore = opponentScores.length > 0 
        ? Math.max(...opponentScores.map((s) => s.gamesWon))
        : 0;
      gamesLost += maxOpponentScore;

      // Determine if user won this set
      // A set is won if the user has the highest score AND reached at least 6 games
      const userWon = userGamesWon === maxScore && userGamesWon >= 6;
      if (userWon) {
        setsWon++;
      } else if (maxScore >= 6) {
        // Someone else won with 6+ games
        setsLost++;
      }

      if (teammateScore && teammateScore.userId && teammateScore.user) {
        const teammateId = teammateScore.userId;
        const teammateName = teammateScore.user.name;
        const teammateAvatar = teammateScore.user.avatarUrl;

        // Track games for teammate stats (count all sets, not just complete ones)
        const existing = teammateStatsMap.get(teammateId) || {
          teammateId,
          teammateName,
          teammateAvatar,
          gamesWon: 0,
          gamesLost: 0,
          totalGames: 0,
        };

        // Add games won (user's games in this set - which is the team's score)
        existing.gamesWon += userGamesWon;
        
        // Add games lost (opponent team's score - excluding teammate)
        existing.gamesLost += maxOpponentScore;
        
        // Calculate total games
        existing.totalGames = existing.gamesWon + existing.gamesLost;

        teammateStatsMap.set(teammateId, existing);
      }
    });

    const totalGames = gamesWon + gamesLost;
    const setWinRate = totalSets > 0 ? (setsWon / totalSets) * 100 : 0;
    const gameWinRate = totalGames > 0 ? (gamesWon / totalGames) * 100 : 0;

    // Convert teammate stats to array and calculate win rates
    const teammateWinRates = Array.from(teammateStatsMap.values())
      .map((stats) => {
        const winRate = stats.totalGames > 0 ? (stats.gamesWon / stats.totalGames) * 100 : 0;
        return {
          ...stats,
          winRate: Math.round(winRate * 10) / 10,
        };
      })
      .sort((a, b) => {
        // Sort by win rate (descending - highest to lowest), then by total games (descending) as tiebreaker
        if (b.winRate !== a.winRate) {
          return b.winRate - a.winRate;
        }
        return b.totalGames - a.totalGames;
      });

    return {
      totalSets,
      setsWon,
      setsLost,
      gamesWon,
      gamesLost,
      totalGames,
      setWinRate: Math.round(setWinRate * 10) / 10,
      gameWinRate: Math.round(gameWinRate * 10) / 10,
      teammateWinRates,
      rating: user?.rating ? Number(user.rating) : null,
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
            rating: true,
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
      rating: number | null;
      totalSets: number;
      totalSetsIncludingIncomplete: number;
      setsWon: number;
      setsLost: number;
      gamesWon: number;
      gamesLost: number;
      processedSets: Set<string>; // Track unique sets processed for this player
    }>();

    allScores.forEach((score) => {
      // Skip guest players - leaderboard is only for registered users
      if (!score.userId || !score.user) {
        return;
      }

      const userId = score.userId;
      const userName = score.user.name;
      const userAvatar = score.user.avatarUrl;
      const setId = score.setId;

      const existing = playerStatsMap.get(userId) || {
        userId,
        userName,
        userAvatar,
        rating: score.user?.rating ? Number(score.user.rating) : null,
        totalSets: 0,
        totalSetsIncludingIncomplete: 0,
        setsWon: 0,
        setsLost: 0,
        gamesWon: 0,
        gamesLost: 0,
        processedSets: new Set<string>(),
      };

      // Track unique sets per player to avoid double-counting
      const isNewSet = !existing.processedSets.has(setId);
      
      if (isNewSet) {
        // Find max score in this set
        const maxScore = Math.max(...score.set.scores.map((s) => s.gamesWon));

        // Count games won for this player in this set (only once per set)
        existing.gamesWon += score.gamesWon;

        // For games lost, find the opponent team's score
        // Group players by score to identify teams (teammates have the same score)
        const scoreGroups = new Map<number, number>();
        score.set.scores.forEach((s) => {
          const gamesWon = s.gamesWon;
          scoreGroups.set(gamesWon, (scoreGroups.get(gamesWon) || 0) + 1);
        });

        // Find which team the current player belongs to (by score)
        const playerTeamScore = score.gamesWon;
        
        // Find opponent team (the team with a different score)
        let maxOpponentScore = 0;
        scoreGroups.forEach((count, teamScore) => {
          if (teamScore !== playerTeamScore) {
            // This is the opponent team, take their score
            maxOpponentScore = Math.max(maxOpponentScore, teamScore);
          }
        });
        
        existing.gamesLost += maxOpponentScore;
        
        existing.processedSets.add(setId);
        // Count all sets (including incomplete ones) - only once per set
        existing.totalSetsIncludingIncomplete++;

        // Only count sets that are complete (maxScore >= 6)
        // This ensures totalSets = setsWon + setsLost
        if (maxScore >= 6) {
          existing.totalSets++;
          
          // Determine if won this set
          if (score.gamesWon === maxScore) {
            existing.setsWon++;
          } else {
            existing.setsLost++;
          }
        }
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

        const { processedSets, ...playerStats } = stats;
        return {
          ...playerStats,
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
            guest: {
              select: {
                id: true,
                name: true,
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

