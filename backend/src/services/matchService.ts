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
    // Helper function to convert guest IDs to a placeholder user ID
    const convertGuestToPlaceholder = async (playerId: string): Promise<string> => {
      // Check if this ID belongs to a guest
      const guest = await prisma.guest.findUnique({ where: { id: playerId } });
      if (guest) {
        // Get or create a "Guest Player" placeholder user
        let guestUser = await prisma.user.findUnique({ 
          where: { email: 'guest@placeholder.local' } 
        });
        
        if (!guestUser) {
          // Create placeholder guest user (should only happen once)
          const bcrypt = require('bcryptjs');
          const passwordHash = await bcrypt.hash('no-login', 10);
          guestUser = await prisma.user.create({
            data: {
              email: 'guest@placeholder.local',
              name: 'Guest Player',
              phone: '',
              passwordHash,
            },
          });
        }
        
        return guestUser.id;
      }
      return playerId; // Not a guest, return original ID
    };

    // Convert any guest IDs to placeholder user ID
    const team1Player1Id = await convertGuestToPlaceholder(data.team1Player1Id);
    const team1Player2Id = await convertGuestToPlaceholder(data.team1Player2Id);
    const team2Player1Id = await convertGuestToPlaceholder(data.team2Player1Id);
    const team2Player2Id = await convertGuestToPlaceholder(data.team2Player2Id);

    // Validate that all 4 player positions are unique (but guests can share the placeholder)
    const originalIds = [
      data.team1Player1Id,
      data.team1Player2Id,
      data.team2Player1Id,
      data.team2Player2Id,
    ];
    const uniqueOriginalIds = new Set(originalIds);
    if (uniqueOriginalIds.size !== 4) {
      throw new Error('All 4 players must be unique');
    }

    // Create the match
    const match = await prisma.match.create({
      data: {
        courtId: data.courtId,
        team1Player1Id,
        team1Player2Id,
        team2Player1Id,
        team2Player2Id,
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
    let matchesWon = 0;
    let matchesLost = 0;
    let gamesWon = 0;
    let gamesLost = 0;
    let totalMatches = 0;

    matches.forEach((match) => {
      const sets = JSON.parse(match.sets) as Set[];
      const isTeam1 =
        match.team1Player1Id === userId || match.team1Player2Id === userId;
      
      totalMatches++;
      
      // Count sets won by each team to determine match winner
      let team1SetsWon = 0;
      let team2SetsWon = 0;
      
      // Count each set individually
      sets.forEach((set) => {
        // A set is only valid if at least one player reached 6 games
        const isValidSet = set.team1 >= 6 || set.team2 >= 6;
        
        if (isValidSet) {
          if (set.team1 > set.team2) {
            team1SetsWon++;
          } else if (set.team2 > set.team1) {
            team2SetsWon++;
          }
        }
        
        // Count sets and games for player stats
        if (isTeam1) {
          // Count games (the numbers in the score, e.g., 6-4 means 6 games won, 4 games lost)
          gamesWon += set.team1;
          gamesLost += set.team2;
          
          // Count sets (only if valid)
          if (isValidSet) {
            if (set.team1 > set.team2) {
              setsWon++;
            } else if (set.team2 > set.team1) {
              setsLost++;
            }
          }
        } else {
          // Count games
          gamesWon += set.team2;
          gamesLost += set.team1;
          
          // Count sets (only if valid)
          if (isValidSet) {
            if (set.team2 > set.team1) {
              setsWon++;
            } else if (set.team1 > set.team2) {
              setsLost++;
            }
          }
        }
      });
      
      // Determine match winner (only if there were valid sets)
      if (team1SetsWon > 0 || team2SetsWon > 0) {
        if (isTeam1) {
          if (team1SetsWon > team2SetsWon) {
            matchesWon++;
          } else if (team2SetsWon > team1SetsWon) {
            matchesLost++;
          }
        } else {
          if (team2SetsWon > team1SetsWon) {
            matchesWon++;
          } else if (team1SetsWon > team2SetsWon) {
            matchesLost++;
          }
        }
      }
    });

    const totalSets = setsWon + setsLost;
    const totalGames = gamesWon + gamesLost;
    const setWinRate = totalSets > 0 ? (setsWon / totalSets) * 100 : 0;
    const gameWinRate = totalGames > 0 ? (gamesWon / totalGames) * 100 : 0;
    const matchWinRate = totalMatches > 0 ? (matchesWon / totalMatches) * 100 : 0;

    return {
      totalMatches,
      matchesWon,
      matchesLost,
      setsWon,
      setsLost,
      totalSets,
      gamesWon,
      gamesLost,
      totalGames,
      setWinRate: Math.round(setWinRate * 10) / 10, // Round to 1 decimal
      gameWinRate: Math.round(gameWinRate * 10) / 10,
      matchWinRate: Math.round(matchWinRate * 10) / 10,
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
      matchesWon: number;
      matchesLost: number;
      setsWon: number;
      setsLost: number;
      gamesWon: number;
      gamesLost: number;
    }>();

    allMatches.forEach((match) => {
      const sets = JSON.parse(match.sets) as Set[];
      
      // Count sets won by each team to determine match winner
      let team1SetsWon = 0;
      let team2SetsWon = 0;
      
      sets.forEach((set) => {
        // A set is only valid if at least one player reached 6 games
        const isValidSet = set.team1 >= 6 || set.team2 >= 6;
        
        if (isValidSet) {
          if (set.team1 > set.team2) {
            team1SetsWon++;
          } else if (set.team2 > set.team1) {
            team2SetsWon++;
          }
        }
      });

      // Process Team 1 players
      [match.team1Player1, match.team1Player2].forEach((player) => {
        const existing = playerStatsMap.get(player.id) || {
          userId: player.id,
          userName: player.name,
          userAvatar: player.avatarUrl,
          totalMatches: 0,
          matchesWon: 0,
          matchesLost: 0,
          setsWon: 0,
          setsLost: 0,
          gamesWon: 0,
          gamesLost: 0,
        };

        existing.totalMatches++;
        
        // Count match wins/losses (only if there were valid sets)
        if (team1SetsWon > 0 || team2SetsWon > 0) {
          if (team1SetsWon > team2SetsWon) {
            existing.matchesWon++;
          } else if (team2SetsWon > team1SetsWon) {
            existing.matchesLost++;
          }
        }
        
        // Count sets and games for Team 1
        sets.forEach((set) => {
          // Count games
          existing.gamesWon += set.team1;
          existing.gamesLost += set.team2;
          
          // Count sets (only if valid)
          const isValidSet = set.team1 >= 6 || set.team2 >= 6;
          if (isValidSet) {
            if (set.team1 > set.team2) {
              existing.setsWon++;
            } else if (set.team2 > set.team1) {
              existing.setsLost++;
            }
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
          matchesWon: 0,
          matchesLost: 0,
          setsWon: 0,
          setsLost: 0,
          gamesWon: 0,
          gamesLost: 0,
        };

        existing.totalMatches++;
        
        // Count match wins/losses (only if there were valid sets)
        if (team1SetsWon > 0 || team2SetsWon > 0) {
          if (team2SetsWon > team1SetsWon) {
            existing.matchesWon++;
          } else if (team1SetsWon > team2SetsWon) {
            existing.matchesLost++;
          }
        }
        
        // Count sets and games for Team 2
        sets.forEach((set) => {
          // Count games
          existing.gamesWon += set.team2;
          existing.gamesLost += set.team1;
          
          // Count sets (only if valid)
          const isValidSet = set.team1 >= 6 || set.team2 >= 6;
          if (isValidSet) {
            if (set.team2 > set.team1) {
              existing.setsWon++;
            } else if (set.team1 > set.team2) {
              existing.setsLost++;
            }
          }
        });

        playerStatsMap.set(player.id, existing);
      });
    });

    // Convert to array and calculate win rates
    const leaderboard = Array.from(playerStatsMap.values())
      .filter((stats) => {
        // Exclude the placeholder guest player from leaderboard
        return stats.userName !== 'Guest Player';
      })
      .map((stats) => {
        const totalSets = stats.setsWon + stats.setsLost;
        const totalGames = stats.gamesWon + stats.gamesLost;
        const setWinRate = totalSets > 0 ? (stats.setsWon / totalSets) * 100 : 0;
        const gameWinRate = totalGames > 0 ? (stats.gamesWon / totalGames) * 100 : 0;
        const matchWinRate = stats.totalMatches > 0 ? (stats.matchesWon / stats.totalMatches) * 100 : 0;
        
        return {
          ...stats,
          totalSets,
          totalGames,
          setWinRate: Math.round(setWinRate * 10) / 10,
          gameWinRate: Math.round(gameWinRate * 10) / 10,
          matchWinRate: Math.round(matchWinRate * 10) / 10,
        };
      })
      .sort((a, b) => {
        // Sort by set win rate first (default)
        if (b.setWinRate !== a.setWinRate) {
          return b.setWinRate - a.setWinRate;
        }
        // If win rates are equal, sort by total sets played
        return b.totalSets - a.totalSets;
      });

    return leaderboard;
  },
};
