import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Constants for UTR calculation
const DEFAULT_RATING = 5.0; // Starting rating for new players
const MIN_RATING = 1.0;
const MAX_RATING = 16.5;
const RATING_DIFF_DIVISOR = 2.5; // Used in expected win percentage calculation
const ADJUSTMENT_FACTOR = 8.0; // Multiplier for rating adjustments
const MAX_MATCHES_TO_CONSIDER = 30; // Maximum matches to include in rating calculation
const MATCH_AGE_LIMIT_DAYS = 365; // Only consider matches from past 12 months

interface SetWithScores {
  id: string;
  createdAt: Date;
  scores: Array<{
    userId: string | null;
    guestId: string | null;
    gamesWon: number;
    user?: { id: string; rating: number | null } | null;
  }>;
}

interface MatchRatingData {
  matchRating: number;
  expectedWinPct: number;
  actualWinPct: number;
  matchWeight: number;
}

/**
 * Calculate expected win percentage based on rating difference
 * Formula: expectedWinPct = 1 / (1 + 10^((opponentRating - playerRating) / 2.5))
 */
function calculateExpectedWinPercentage(
  playerRating: number,
  opponentRating: number
): number {
  const ratingDiff = opponentRating - playerRating;
  const exponent = ratingDiff / RATING_DIFF_DIVISOR;
  const denominator = 1 + Math.pow(10, exponent);
  return 1 / denominator;
}

/**
 * Get player's current rating or default
 */
async function getPlayerRating(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { rating: true },
  });
  return user?.rating ? Number(user.rating) : DEFAULT_RATING;
}

/**
 * Get temporary rating for guest players (average of other players in match)
 */
function getGuestRating(
  setScores: SetWithScores['scores'],
  excludeUserId?: string
): number {
  const userRatings = setScores
    .filter((s) => s.userId && s.userId !== excludeUserId && s.user?.rating)
    .map((s) => Number(s.user!.rating!));

  if (userRatings.length === 0) {
    return DEFAULT_RATING;
  }

  return userRatings.reduce((sum, rating) => sum + rating, 0) / userRatings.length;
}

/**
 * Calculate team rating (average of two players)
 */
function calculateTeamRating(
  player1Rating: number,
  player2Rating: number
): number {
  return (player1Rating + player2Rating) / 2;
}

/**
 * Calculate match weight based on competitiveness and format
 */
function calculateMatchWeight(
  playerGamesWon: number,
  opponentGamesWon: number,
  totalGames: number
): number {
  const baseWeight = 1.0;

  // Competitiveness factor: closer matches get higher weight
  const scoreDiff = Math.abs(playerGamesWon - opponentGamesWon);
  const competitivenessFactor = Math.max(0.5, 1.0 - scoreDiff / 12.0); // Max weight for 0-0 diff, decreases as diff increases

  // Format factor: longer matches (more games) get higher weight
  const formatFactor = Math.min(1.5, 0.5 + totalGames / 20.0); // Scales from 0.5 to 1.5 based on total games

  return baseWeight * competitivenessFactor * formatFactor;
}

/**
 * Calculate recency weight (more recent matches weighted higher)
 */
function calculateRecencyWeight(matchDate: Date): number {
  const now = new Date();
  const daysSinceMatch = (now.getTime() - matchDate.getTime()) / (1000 * 60 * 60 * 24);
  const daysInPeriod = MATCH_AGE_LIMIT_DAYS;

  // Linear decay: 1.0 for today, 0.0 for matches older than limit
  if (daysSinceMatch >= daysInPeriod) {
    return 0.0;
  }

  return 1.0 - daysSinceMatch / daysInPeriod;
}

/**
 * Calculate expected match prediction for a doubles match
 * Returns expected scores for 3 sets and match weight
 */
export async function calculateMatchPrediction(
  team1PlayerIds: string[],
  team2PlayerIds: string[]
): Promise<{
  team1ExpectedWinPct: number;
  team2ExpectedWinPct: number;
  expectedSetScores: Array<{ team1Games: number; team2Games: number }>;
  matchWeight: number;
} | null> {
  if (team1PlayerIds.length !== 2 || team2PlayerIds.length !== 2) {
    return null;
  }

  // Get ratings for all players
  const team1Ratings = await Promise.all(
    team1PlayerIds.map(async (id) => {
      // Check if it's a user or guest
      const user = await prisma.user.findUnique({ where: { id }, select: { rating: true } });
      if (user) {
        return user.rating ? Number(user.rating) : DEFAULT_RATING;
      }
      // For guests, use default rating (we don't have historical data)
      return DEFAULT_RATING;
    })
  );

  const team2Ratings = await Promise.all(
    team2PlayerIds.map(async (id) => {
      const user = await prisma.user.findUnique({ where: { id }, select: { rating: true } });
      if (user) {
        return user.rating ? Number(user.rating) : DEFAULT_RATING;
      }
      return DEFAULT_RATING;
    })
  );

  // Calculate team ratings (average of two players)
  const team1Rating = calculateTeamRating(team1Ratings[0], team1Ratings[1]);
  const team2Rating = calculateTeamRating(team2Ratings[0], team2Ratings[1]);

  // Calculate expected win percentage for team 1
  const team1ExpectedWinPct = calculateExpectedWinPercentage(team1Rating, team2Rating);
  const team2ExpectedWinPct = 1 - team1ExpectedWinPct;

  // Calculate expected games per set (assuming best of 3 sets, first to 6 games wins)
  // Expected games won = expectedWinPct * totalGamesPerSet
  // For a typical set: first to 6 games, so total games could be 6-12 (6-0 to 6-6)
  // We'll use an average of ~10 games per set for calculation
  const avgGamesPerSet = 10;
  const team1ExpectedGamesPerSet = team1ExpectedWinPct * avgGamesPerSet;
  const team2ExpectedGamesPerSet = team2ExpectedWinPct * avgGamesPerSet;

  // Helper function to calculate realistic set score
  // Ensures at least one team reaches 6 games (winning condition)
  const calculateSetScore = (team1Games: number, team2Games: number) => {
    // Normalize so the sum is approximately 10 games
    const total = team1Games + team2Games;
    let normalizedTeam1 = Math.round((team1Games / total) * 10);
    let normalizedTeam2 = Math.round((team2Games / total) * 10);
    
    // Ensure at least one team reaches 6 (winning condition)
    if (normalizedTeam1 >= normalizedTeam2) {
      normalizedTeam1 = Math.max(6, normalizedTeam1);
      normalizedTeam2 = Math.min(6, Math.max(0, 10 - normalizedTeam1));
    } else {
      normalizedTeam2 = Math.max(6, normalizedTeam2);
      normalizedTeam1 = Math.min(6, Math.max(0, 10 - normalizedTeam2));
    }
    
    // Ensure scores don't exceed reasonable limits (max 6-6 for a set)
    normalizedTeam1 = Math.min(6, Math.max(0, normalizedTeam1));
    normalizedTeam2 = Math.min(6, Math.max(0, normalizedTeam2));
    
    return { team1Games: normalizedTeam1, team2Games: normalizedTeam2 };
  };

  // Calculate expected scores for 3 sets
  const baseScore = calculateSetScore(team1ExpectedGamesPerSet, team2ExpectedGamesPerSet);
  const expectedSetScores = [
    baseScore,
    baseScore,
    baseScore,
  ];

  // Calculate match weight (for a competitive match, assume close scores)
  const expectedScoreDiff = Math.abs(team1ExpectedGamesPerSet - team2ExpectedGamesPerSet);
  const matchWeight = calculateMatchWeight(
    team1ExpectedGamesPerSet,
    team2ExpectedGamesPerSet,
    avgGamesPerSet
  );

  return {
    team1ExpectedWinPct,
    team2ExpectedWinPct,
    expectedSetScores,
    matchWeight,
  };
}

/**
 * Calculate match rating for a player in a doubles match
 */
async function calculateMatchRating(
  userId: string,
  set: SetWithScores
): Promise<MatchRatingData | null> {
  const playerRating = await getPlayerRating(userId);

  // Find player's score
  const playerScore = set.scores.find((s) => s.userId === userId);
  if (!playerScore) {
    return null;
  }

  // Group players by score to identify teams
  const scoreGroups = new Map<number, Array<typeof set.scores[0]>>();
  set.scores.forEach((score) => {
    const gamesWon = score.gamesWon;
    if (!scoreGroups.has(gamesWon)) {
      scoreGroups.set(gamesWon, []);
    }
    scoreGroups.get(gamesWon)!.push(score);
  });

  // Find player's team (players with same score)
  const playerTeamScore = playerScore.gamesWon;
  const playerTeam = scoreGroups.get(playerTeamScore) || [];

  // Find opponent team (players with different score)
  const opponentTeam: Array<typeof set.scores[0]> = [];
  scoreGroups.forEach((players, score) => {
    if (score !== playerTeamScore) {
      opponentTeam.push(...players);
    }
  });

  if (opponentTeam.length === 0) {
    return null; // Can't calculate without opponents
  }

  // Calculate team ratings
  // For player's team: get teammate rating (or guest estimate)
  const teammateScore = playerTeam.find((s) => s.userId !== userId);
  let teammateRating: number;
  if (teammateScore?.userId) {
    teammateRating = await getPlayerRating(teammateScore.userId);
  } else {
    // Guest player - use temporary rating
    teammateRating = getGuestRating(set.scores, userId);
  }

  const playerTeamRating = calculateTeamRating(playerRating, teammateRating);

  // For opponent team: average opponent ratings
  const opponentRatings: number[] = [];
  for (const opponentScore of opponentTeam) {
    if (opponentScore.userId) {
      opponentRatings.push(await getPlayerRating(opponentScore.userId));
    } else {
      // Guest player - use temporary rating
      opponentRatings.push(getGuestRating(set.scores, userId));
    }
  }
  const opponentTeamRating =
    opponentRatings.reduce((sum, r) => sum + r, 0) / opponentRatings.length;

  // Calculate expected win percentage
  const expectedWinPct = calculateExpectedWinPercentage(
    playerTeamRating,
    opponentTeamRating
  );

  // Calculate actual win percentage
  const totalGames =
    playerTeamScore +
    opponentTeam.reduce((sum, s) => sum + s.gamesWon, 0);
  const actualWinPct =
    totalGames > 0 ? playerTeamScore / totalGames : 0.5;

  // Calculate match rating adjustment
  const performanceDiff = actualWinPct - expectedWinPct;
  const matchRating = Math.max(
    MIN_RATING,
    Math.min(MAX_RATING, playerRating + performanceDiff * ADJUSTMENT_FACTOR)
  );

  // Calculate match weight
  const opponentGamesWon = opponentTeam.reduce(
    (sum, s) => sum + s.gamesWon,
    0
  );
  const matchWeight = calculateMatchWeight(
    playerTeamScore,
    opponentGamesWon,
    totalGames
  );

  return {
    matchRating,
    expectedWinPct,
    actualWinPct,
    matchWeight,
  };
}

/**
 * Calculate overall UTR rating for a player
 * Uses weighted average of up to 30 most recent matches from past 12 months
 */
export async function calculatePlayerRating(userId: string): Promise<number> {
  // Get all sets where player participated, ordered by date
  const userScores = await prisma.setScore.findMany({
    where: {
      userId,
      set: {
        createdAt: {
          gte: new Date(
            Date.now() - MATCH_AGE_LIMIT_DAYS * 24 * 60 * 60 * 1000
          ),
        },
      },
    },
    include: {
      set: {
        include: {
          scores: {
            include: {
              user: {
                select: {
                  id: true,
                  rating: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      set: {
        createdAt: 'desc',
      },
    },
    take: MAX_MATCHES_TO_CONSIDER,
  });

  if (userScores.length === 0) {
    return DEFAULT_RATING;
  }

  // Calculate match ratings for each set
  const matchRatings: Array<MatchRatingData & { createdAt: Date }> = [];

  for (const userScore of userScores) {
    const matchRatingData = await calculateMatchRating(userId, userScore.set);
    if (matchRatingData) {
      matchRatings.push({
        ...matchRatingData,
        createdAt: userScore.set.createdAt,
      });
    }
  }

  if (matchRatings.length === 0) {
    return DEFAULT_RATING;
  }

  // Calculate weighted average with recency weighting
  let weightedSum = 0;
  let weightSum = 0;

  for (const matchRating of matchRatings) {
    const recencyWeight = calculateRecencyWeight(matchRating.createdAt);
    const totalWeight = matchRating.matchWeight * recencyWeight;

    weightedSum += matchRating.matchRating * totalWeight;
    weightSum += totalWeight;
  }

  if (weightSum === 0) {
    return DEFAULT_RATING;
  }

  const calculatedRating = weightedSum / weightSum;
  return Math.max(MIN_RATING, Math.min(MAX_RATING, calculatedRating));
}

/**
 * Update player's rating and create history entry
 */
export async function updatePlayerRating(
  userId: string,
  setId: string | null = null
): Promise<number> {
  const previousRating = await getPlayerRating(userId);
  const newRating = await calculatePlayerRating(userId);

  // Get match rating data if setId is provided
  let matchRating: number | null = null;
  if (setId) {
    const set = await prisma.set.findUnique({
      where: { id: setId },
      include: {
        scores: {
          include: {
            user: {
              select: {
                id: true,
                rating: true,
              },
            },
          },
        },
      },
    });

    if (set) {
      const matchRatingData = await calculateMatchRating(userId, set);
      if (matchRatingData) {
        matchRating = matchRatingData.matchRating;

        // Store match rating for transparency/debugging
        await prisma.matchRating.upsert({
          where: {
            userId_setId: {
              userId,
              setId,
            },
          },
          create: {
            userId,
            setId,
            matchRating: matchRatingData.matchRating,
            expectedWinPct: matchRatingData.expectedWinPct,
            actualWinPct: matchRatingData.actualWinPct,
            matchWeight: matchRatingData.matchWeight,
          },
          update: {
            matchRating: matchRatingData.matchRating,
            expectedWinPct: matchRatingData.expectedWinPct,
            actualWinPct: matchRatingData.actualWinPct,
            matchWeight: matchRatingData.matchWeight,
          },
        });
      }
    }
  }

  // Update user rating
  await prisma.user.update({
    where: { id: userId },
    data: {
      rating: newRating,
      ratingUpdatedAt: new Date(),
    },
  });

  // Create rating history entry
  await prisma.ratingHistory.create({
    data: {
      userId,
      rating: newRating,
      previousRating: previousRating !== DEFAULT_RATING ? previousRating : null,
      setId,
      matchRating,
    },
  });

  return newRating;
}

/**
 * Recalculate ratings for all players affected by a set
 */
export async function recalculateRatingsForSet(setId: string): Promise<void> {
  const set = await prisma.set.findUnique({
    where: { id: setId },
    include: {
      scores: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!set) {
    return;
  }

  // Get all unique user IDs (exclude guests)
  const userIds = Array.from(
    new Set(
      set.scores
        .map((s) => s.userId)
        .filter((id): id is string => id !== null)
    )
  );

  // Recalculate ratings for all affected players
  await Promise.all(
    userIds.map((userId) => updatePlayerRating(userId, setId))
  );
}

/**
 * Recalculate ratings for a specific player
 */
export async function recalculatePlayerRating(userId: string): Promise<number> {
  return updatePlayerRating(userId);
}

/**
 * Get rating history for a player
 */
export async function getRatingHistory(userId: string) {
  return prisma.ratingHistory.findMany({
    where: { userId },
    include: {
      set: {
        select: {
          id: true,
          setNumber: true,
          createdAt: true,
          court: {
            select: {
              courtNumber: true,
              session: {
                select: {
                  date: true,
                  venueName: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Get match rating details for a player in a specific set
 */
export async function getMatchRating(userId: string, setId: string) {
  return prisma.matchRating.findUnique({
    where: {
      userId_setId: {
        userId,
        setId,
      },
    },
    include: {
      set: {
        select: {
          id: true,
          setNumber: true,
          createdAt: true,
        },
      },
    },
  });
}

