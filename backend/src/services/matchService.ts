import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Set {
  team1: number;
  team2: number;
}

interface CreateMatchData {
  courtId: string;
  team1Player1Id: string;
  team1Player2Id: string;
  team2Player1Id: string;
  team2Player2Id: string;
  sets: Set[];
  createdById: string;
}

interface UpdateMatchData {
  sets?: Set[];
}

export const matchService = {
  async createMatch(data: CreateMatchData) {
    // Validate that all 4 players are unique
    const playerIds = [
      data.team1Player1Id,
      data.team1Player2Id,
      data.team2Player1Id,
      data.team2Player2Id,
    ];
    const uniquePlayerIds = new Set(playerIds);
    if (uniquePlayerIds.size !== 4) {
      throw new Error('All 4 players must be unique');
    }

    // Create the match
    const match = await prisma.match.create({
      data: {
        courtId: data.courtId,
        team1Player1Id: data.team1Player1Id,
        team1Player2Id: data.team1Player2Id,
        team2Player1Id: data.team2Player1Id,
        team2Player2Id: data.team2Player2Id,
        sets: JSON.stringify(data.sets),
        createdById: data.createdById,
      },
      include: {
        court: {
          include: {
            session: true,
          },
        },
        team1Player1: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        team1Player2: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        team2Player1: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        team2Player2: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
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

    return match;
  },

  async getMatchesBySession(sessionId: string) {
    const matches = await prisma.match.findMany({
      where: {
        court: {
          sessionId: sessionId,
        },
      },
      include: {
        court: true,
        team1Player1: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        team1Player2: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        team2Player1: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        team2Player2: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return matches;
  },

  async getMatchById(matchId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        court: {
          include: {
            session: true,
          },
        },
        team1Player1: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        team1Player2: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        team2Player1: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        team2Player2: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
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

    if (!match) {
      throw new Error('Match not found');
    }

    return match;
  },

  async updateMatch(matchId: string, userId: string, data: UpdateMatchData) {
    // Get the match to check permissions
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new Error('Match not found');
    }

    // Only the creator can update the match
    if (match.createdById !== userId) {
      throw new Error('Only the match creator can update this match');
    }

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        ...(data.sets !== undefined && { sets: JSON.stringify(data.sets) }),
      },
      include: {
        court: true,
        team1Player1: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        team1Player2: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        team2Player1: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        team2Player2: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return updatedMatch;
  },

  async deleteMatch(matchId: string, userId: string) {
    // Get the match to check permissions
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new Error('Match not found');
    }

    // Only the creator can delete the match
    if (match.createdById !== userId) {
      throw new Error('Only the match creator can delete this match');
    }

    await prisma.match.delete({
      where: { id: matchId },
    });

    return { message: 'Match deleted successfully' };
  },

  async getPlayerStats(userId: string) {
    // Get all matches where the user participated
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { team1Player1Id: userId },
          { team1Player2Id: userId },
          { team2Player1Id: userId },
          { team2Player2Id: userId },
        ],
      },
      include: {
        court: {
          include: {
            session: true,
          },
        },
      },
    });

    let setsWon = 0;
    let setsLost = 0;
    let totalMatches = 0;

    matches.forEach((match) => {
      const sets = JSON.parse(match.sets) as Set[];
      const isTeam1 =
        match.team1Player1Id === userId || match.team1Player2Id === userId;
      
      totalMatches++;
      
      // Count each set individually
      sets.forEach((set) => {
        if (isTeam1) {
          if (set.team1 > set.team2) {
            setsWon++;
          } else if (set.team2 > set.team1) {
            setsLost++;
          }
        } else {
          if (set.team2 > set.team1) {
            setsWon++;
          } else if (set.team1 > set.team2) {
            setsLost++;
          }
        }
      });
    });

    const totalSets = setsWon + setsLost;
    const winRate = totalSets > 0 ? (setsWon / totalSets) * 100 : 0;

    return {
      totalMatches,
      setsWon,
      setsLost,
      totalSets,
      winRate: Math.round(winRate * 10) / 10, // Round to 1 decimal
    };
  },

  async getLeaderboard() {
    // Get all users who have played at least one match
    const allMatches = await prisma.match.findMany({
      include: {
        team1Player1: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        team1Player2: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        team2Player1: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        team2Player2: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Collect all unique players
    const playerStatsMap = new Map<string, {
      userId: string;
      userName: string;
      userAvatar: string | null;
      totalMatches: number;
      setsWon: number;
      setsLost: number;
    }>();

    allMatches.forEach((match) => {
      const sets = JSON.parse(match.sets) as Set[];

      // Process Team 1 players
      [match.team1Player1, match.team1Player2].forEach((player) => {
        const existing = playerStatsMap.get(player.id) || {
          userId: player.id,
          userName: player.name,
          userAvatar: player.avatarUrl,
          totalMatches: 0,
          setsWon: 0,
          setsLost: 0,
        };

        existing.totalMatches++;
        
        // Count each set individually for Team 1
        sets.forEach((set) => {
          if (set.team1 > set.team2) {
            existing.setsWon++;
          } else if (set.team2 > set.team1) {
            existing.setsLost++;
          }
        });

        playerStatsMap.set(player.id, existing);
      });

      // Process Team 2 players
      [match.team2Player1, match.team2Player2].forEach((player) => {
        const existing = playerStatsMap.get(player.id) || {
          userId: player.id,
          userName: player.name,
          userAvatar: player.avatarUrl,
          totalMatches: 0,
          setsWon: 0,
          setsLost: 0,
        };

        existing.totalMatches++;
        
        // Count each set individually for Team 2
        sets.forEach((set) => {
          if (set.team2 > set.team1) {
            existing.setsWon++;
          } else if (set.team1 > set.team2) {
            existing.setsLost++;
          }
        });

        playerStatsMap.set(player.id, existing);
      });
    });

    // Convert to array and calculate win rates
    const leaderboard = Array.from(playerStatsMap.values())
      .map((stats) => {
        const totalSets = stats.setsWon + stats.setsLost;
        return {
          ...stats,
          totalSets,
          winRate: totalSets > 0 ? (stats.setsWon / totalSets) * 100 : 0,
        };
      })
      .sort((a, b) => {
        // Sort by win rate first
        if (b.winRate !== a.winRate) {
          return b.winRate - a.winRate;
        }
        // If win rates are equal, sort by total sets played
        return b.totalSets - a.totalSets;
      });

    return leaderboard;
  },
};
