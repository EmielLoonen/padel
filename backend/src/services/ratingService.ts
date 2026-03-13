import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DSS (Dynamisch Speelsterkte Systeem) constants
const DEFAULT_RATING = 4.5;         // Starting rating for new players
const MIN_RATING = 1.0;
const MAX_RATING = 20.0;
const Q = 2.012;                    // Logistic steepness factor for doubles
const K = 0.275;                    // Maximum rating change per set
const MATCH_AGE_LIMIT_DAYS = 365;
const MAX_SETS_TO_CONSIDER = 30;

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
 * DSS win expectation formula for doubles:
 * prob = 1 / (1 + e^(-q * (R_team1 - R_team2)))
 */
function calculateExpectedWinPercentage(
  teamRating: number,
  opponentTeamRating: number
): number {
  return 1 / (1 + Math.exp(-Q * (teamRating - opponentTeamRating)));
}

/**
 * DSS team rating: average of both partners
 */
function calculateTeamRating(r1: number, r2: number): number {
  return (r1 + r2) / 2;
}

/**
 * DSS games-based result (padel 2025 update):
 * result = gamesWon / (gamesWon + gamesLost), in range [0, 1]
 * This replaces the binary win/loss with a continuous measure.
 */
function calculateResult(gamesWon: number, gamesLost: number): number {
  const total = gamesWon + gamesLost;
  return total > 0 ? gamesWon / total : 0.5;
}

async function getPlayerRating(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { rating: true },
  });
  return user?.rating ? Number(user.rating) : DEFAULT_RATING;
}

function getGuestRating(
  setScores: SetWithScores['scores'],
  excludeUserId?: string
): number {
  const userRatings = setScores
    .filter((s) => s.userId && s.userId !== excludeUserId && s.user?.rating)
    .map((s) => Number(s.user!.rating!));
  if (userRatings.length === 0) return DEFAULT_RATING;
  return userRatings.reduce((sum, r) => sum + r, 0) / userRatings.length;
}

/**
 * Calculate match prediction for a doubles match
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
  if (team1PlayerIds.length !== 2 || team2PlayerIds.length !== 2) return null;

  const getRating = async (id: string) => {
    const user = await prisma.user.findUnique({ where: { id }, select: { rating: true } });
    return user?.rating ? Number(user.rating) : DEFAULT_RATING;
  };

  const [t1r1, t1r2, t2r1, t2r2] = await Promise.all([
    getRating(team1PlayerIds[0]),
    getRating(team1PlayerIds[1]),
    getRating(team2PlayerIds[0]),
    getRating(team2PlayerIds[1]),
  ]);

  const team1Rating = calculateTeamRating(t1r1, t1r2);
  const team2Rating = calculateTeamRating(t2r1, t2r2);

  const team1ExpectedWinPct = calculateExpectedWinPercentage(team1Rating, team2Rating);
  const team2ExpectedWinPct = 1 - team1ExpectedWinPct;

  // Expected set score: winner gets 6, loser gets proportional games
  const loserGames = Math.min(5, Math.round(Math.min(team1ExpectedWinPct, team2ExpectedWinPct) * 10));
  const setScore = team1ExpectedWinPct >= team2ExpectedWinPct
    ? { team1Games: 6, team2Games: loserGames }
    : { team1Games: loserGames, team2Games: 6 };

  return {
    team1ExpectedWinPct,
    team2ExpectedWinPct,
    expectedSetScores: [setScore, setScore, setScore],
    matchWeight: 1.0,
  };
}

/**
 * Calculate DSS rating update for a player in a set.
 *
 * DSS formula: R_new = R_old + K × (result − expected)
 * - result   = gamesWon / totalGames  (games-based, 0–1)
 * - expected = logistic win probability based on team ratings
 * - K        = 0.275
 */
export async function calculateMatchRating(
  userId: string,
  set: SetWithScores,
  playerRatingAtMatchTime: number,
  opponentRatingsAtMatchTime?: Map<string, number>
): Promise<MatchRatingData | null> {
  const playerScore = set.scores.find((s) => s.userId === userId);
  if (!playerScore) return null;

  // Group players into teams by games won
  const scoreGroups = new Map<number, Array<typeof set.scores[0]>>();
  set.scores.forEach((score) => {
    if (!scoreGroups.has(score.gamesWon)) scoreGroups.set(score.gamesWon, []);
    scoreGroups.get(score.gamesWon)!.push(score);
  });

  const playerTeamScore = playerScore.gamesWon;
  const playerTeam = scoreGroups.get(playerTeamScore) || [];
  const opponentTeam: Array<typeof set.scores[0]> = [];
  scoreGroups.forEach((players, score) => {
    if (score !== playerTeamScore) opponentTeam.push(...players);
  });

  if (opponentTeam.length === 0) return null;

  // Teammate rating
  const teammateScore = playerTeam.find((s) => s.userId !== userId);
  let teammateRating: number;
  if (teammateScore?.userId) {
    teammateRating =
      opponentRatingsAtMatchTime?.get(teammateScore.userId) ??
      (await getPlayerRating(teammateScore.userId));
  } else {
    teammateRating = getGuestRating(set.scores, userId);
  }

  // Opponent ratings
  const opponentRatings: number[] = [];
  for (const opp of opponentTeam) {
    if (opp.userId) {
      opponentRatings.push(
        opponentRatingsAtMatchTime?.get(opp.userId) ??
          (await getPlayerRating(opp.userId))
      );
    } else {
      opponentRatings.push(getGuestRating(set.scores, userId));
    }
  }

  // DSS team ratings (average of partners)
  const playerTeamRating = calculateTeamRating(playerRatingAtMatchTime, teammateRating);
  const opponentTeamRating =
    opponentRatings.reduce((s, r) => s + r, 0) / opponentRatings.length;

  // DSS expected win probability
  const expectedWinPct = calculateExpectedWinPercentage(playerTeamRating, opponentTeamRating);

  // DSS actual result (games-based).
  // In padel both players on a team always share the same score, so we use the
  // average opponent score (= their team score) rather than summing individuals,
  // which would double-count and make every win look like a loss.
  const opponentGamesWon =
    opponentTeam.reduce((s, o) => s + o.gamesWon, 0) / Math.max(1, opponentTeam.length);
  const actualWinPct = calculateResult(playerTeamScore, opponentGamesWon);

  // DSS rating update: R_new = R_old + K × (result − expected)
  const newRating = Math.max(
    MIN_RATING,
    Math.min(MAX_RATING, playerRatingAtMatchTime + K * (actualWinPct - expectedWinPct))
  );

  return {
    matchRating: newRating,
    expectedWinPct,
    actualWinPct,
    matchWeight: 1.0, // DSS uses a fixed K-factor, no variable match weight
  };
}

/**
 * Recalculate a player's DSS rating from scratch.
 * Processes sets chronologically (oldest first), applying the DSS
 * incremental update at each step starting from DEFAULT_RATING.
 *
 * Accepts an optional liveRatings map so a global recalculation can pass in
 * the ratings of other players as they stood at the time of each set,
 * rather than reading stale/post-recalc values from the DB.
 */
export async function calculatePlayerRating(
  userId: string,
  liveRatings?: Map<string, number>
): Promise<number> {
  const userScores = await prisma.setScore.findMany({
    where: {
      userId,
      set: {
        createdAt: {
          gte: new Date(Date.now() - MATCH_AGE_LIMIT_DAYS * 24 * 60 * 60 * 1000),
        },
      },
    },
    include: {
      set: {
        include: {
          scores: {
            include: {
              user: { select: { id: true, rating: true } },
            },
          },
        },
      },
    },
    orderBy: { set: { createdAt: 'asc' } },
    take: MAX_SETS_TO_CONSIDER,
  });

  if (userScores.length === 0) return DEFAULT_RATING;

  // Start from DEFAULT and apply DSS incrementally through each set
  let rating = DEFAULT_RATING;

  for (const userScore of userScores) {
    const set: SetWithScores = {
      ...userScore.set,
      scores: userScore.set.scores.map((s) => ({
        userId: s.userId,
        guestId: s.guestId,
        gamesWon: s.gamesWon,
        user: s.user
          ? { id: s.user.id, rating: s.user.rating ? Number(s.user.rating) : null }
          : null,
      })),
    };

    const matchData = await calculateMatchRating(userId, set, rating, liveRatings);
    if (matchData) {
      rating = matchData.matchRating;
    }
  }

  return Math.max(MIN_RATING, Math.min(MAX_RATING, rating));
}

/**
 * Recalculate DSS ratings for ALL players globally in one pass.
 *
 * Processes every set in chronological order, updating an in-memory ratings
 * map after each set. This ensures each player's rating at the time of a set
 * is based on their actual history up to that point — not post-recalc values
 * from the DB — which is the correct way to apply the DSS formula.
 */
export async function recalculateAllRatings(): Promise<Map<string, number>> {
  // Fetch all sets with all scores, ordered oldest first
  const allSets = await prisma.set.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - MATCH_AGE_LIMIT_DAYS * 24 * 60 * 60 * 1000),
      },
    },
    include: {
      scores: {
        include: {
          user: { select: { id: true, rating: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  // In-memory rating map — everyone starts at DEFAULT
  const ratings = new Map<string, number>();
  const getRating = (userId: string) => ratings.get(userId) ?? DEFAULT_RATING;

  for (const rawSet of allSets) {
    // Collect the user IDs in this set
    const userIds = rawSet.scores
      .map((s) => s.userId)
      .filter((id): id is string => id !== null);

    // Build a snapshot of all players' current live ratings for this set
    const snapshotRatings = new Map<string, number>(
      userIds.map((id) => [id, getRating(id)])
    );

    // Build SetWithScores injecting live ratings so getGuestRating also uses
    // current in-memory values rather than stale DB values
    const set: SetWithScores = {
      ...rawSet,
      scores: rawSet.scores.map((s) => ({
        userId: s.userId,
        guestId: s.guestId,
        gamesWon: s.gamesWon,
        user: s.userId
          ? { id: s.userId, rating: getRating(s.userId) }
          : null,
      })),
    };

    // Calculate and apply new ratings for each player in the set
    const newRatings = new Map<string, number>();
    for (const userId of userIds) {
      const currentRating = getRating(userId);
      const matchData = await calculateMatchRating(userId, set, currentRating, snapshotRatings);
      if (matchData) {
        newRatings.set(userId, matchData.matchRating);
      }
    }

    // Apply all new ratings after processing the full set
    for (const [id, rating] of newRatings) {
      ratings.set(id, rating);
    }
  }

  // Persist all recalculated ratings to the DB
  for (const [userId, rating] of ratings) {
    await prisma.user.update({
      where: { id: userId },
      data: { rating, ratingUpdatedAt: new Date() },
    });
  }

  return ratings;
}

/**
 * Update a player's stored rating and write a history entry.
 */
export async function updatePlayerRating(
  userId: string,
  setId: string | null = null
): Promise<number> {
  const previousRating = await getPlayerRating(userId);
  const newRating = await calculatePlayerRating(userId);

  let matchRating: number | null = null;
  if (setId) {
    const set = await prisma.set.findUnique({
      where: { id: setId },
      include: {
        scores: {
          include: { user: { select: { id: true, rating: true } } },
        },
      },
    });

    if (set) {
      const setWithRatings: SetWithScores = {
        ...set,
        scores: set.scores.map((s) => ({
          userId: s.userId,
          guestId: s.guestId,
          gamesWon: s.gamesWon,
          user: s.user
            ? { id: s.user.id, rating: s.user.rating ? Number(s.user.rating) : null }
            : null,
        })),
      };

      const matchRatingData = await calculateMatchRating(
        userId,
        setWithRatings,
        previousRating
      );

      if (matchRatingData) {
        matchRating = matchRatingData.matchRating;

        await prisma.matchRating.upsert({
          where: { userId_setId: { userId, setId } },
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

  await prisma.user.update({
    where: { id: userId },
    data: { rating: newRating, ratingUpdatedAt: new Date() },
  });

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
 * Recalculate ratings for all registered players in a set.
 */
export async function recalculateRatingsForSet(setId: string): Promise<void> {
  const set = await prisma.set.findUnique({
    where: { id: setId },
    include: { scores: { select: { userId: true } } },
  });

  if (!set) return;

  const userIds = Array.from(
    new Set(set.scores.map((s) => s.userId).filter((id): id is string => id !== null))
  );

  await Promise.all(userIds.map((userId) => updatePlayerRating(userId, setId)));
}

/**
 * Recalculate rating for a specific player.
 */
export async function recalculatePlayerRating(userId: string): Promise<number> {
  return updatePlayerRating(userId);
}

/**
 * Get rating history for a player.
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
              session: { select: { date: true, venueName: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get DSS match rating details for a player in a specific set.
 */
export async function getMatchRating(userId: string, setId: string) {
  return prisma.matchRating.findUnique({
    where: { userId_setId: { userId, setId } },
    include: {
      set: {
        select: { id: true, setNumber: true, createdAt: true },
      },
    },
  });
}
