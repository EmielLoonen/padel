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
 */
function calculateResult(gamesWon: number, gamesLost: number): number {
  const total = gamesWon + gamesLost;
  return total > 0 ? gamesWon / total : 0.5;
}

async function getPlayerRating(userId: string, groupId: string): Promise<number> {
  const membership = await prisma.userGroup.findUnique({
    where: { userId_groupId: { userId, groupId } },
    select: { rating: true },
  });
  return membership?.rating ? Number(membership.rating) : DEFAULT_RATING;
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
 * Calculate match prediction for a doubles match (group-scoped ratings)
 */
export async function calculateMatchPrediction(
  team1PlayerIds: string[],
  team2PlayerIds: string[],
  groupId: string
): Promise<{
  team1ExpectedWinPct: number;
  team2ExpectedWinPct: number;
  expectedSetScores: Array<{ team1Games: number; team2Games: number }>;
  matchWeight: number;
} | null> {
  if (team1PlayerIds.length !== 2 || team2PlayerIds.length !== 2) return null;

  const getRating = async (id: string) => getPlayerRating(id, groupId);

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
 */
export async function calculateMatchRating(
  userId: string,
  set: SetWithScores,
  playerRatingAtMatchTime: number,
  opponentRatingsAtMatchTime?: Map<string, number>
): Promise<MatchRatingData | null> {
  const playerScore = set.scores.find((s) => s.userId === userId);
  if (!playerScore) return null;

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

  const teammateScore = playerTeam.find((s) => s.userId !== userId);
  let teammateRating: number;
  if (teammateScore?.userId) {
    teammateRating =
      opponentRatingsAtMatchTime?.get(teammateScore.userId) ?? DEFAULT_RATING;
  } else {
    teammateRating = getGuestRating(set.scores, userId);
  }

  const opponentRatings: number[] = [];
  for (const opp of opponentTeam) {
    if (opp.userId) {
      opponentRatings.push(
        opponentRatingsAtMatchTime?.get(opp.userId) ?? DEFAULT_RATING
      );
    } else {
      opponentRatings.push(getGuestRating(set.scores, userId));
    }
  }

  const playerTeamRating = calculateTeamRating(playerRatingAtMatchTime, teammateRating);
  const opponentTeamRating =
    opponentRatings.reduce((s, r) => s + r, 0) / opponentRatings.length;

  const expectedWinPct = calculateExpectedWinPercentage(playerTeamRating, opponentTeamRating);

  const opponentGamesWon =
    opponentTeam.reduce((s, o) => s + o.gamesWon, 0) / Math.max(1, opponentTeam.length);
  const actualWinPct = calculateResult(playerTeamScore, opponentGamesWon);

  const newRating = Math.max(
    MIN_RATING,
    Math.min(MAX_RATING, playerRatingAtMatchTime + K * (actualWinPct - expectedWinPct))
  );

  return {
    matchRating: newRating,
    expectedWinPct,
    actualWinPct,
    matchWeight: 1.0,
  };
}

/**
 * Recalculate a player's DSS rating from scratch for a specific group.
 */
export async function calculatePlayerRating(
  userId: string,
  groupId: string,
  liveRatings?: Map<string, number>
): Promise<number> {
  const userScores = await prisma.setScore.findMany({
    where: {
      userId,
      set: {
        createdAt: {
          gte: new Date(Date.now() - MATCH_AGE_LIMIT_DAYS * 24 * 60 * 60 * 1000),
        },
        court: { session: { groupId } },
      },
    },
    include: {
      set: {
        include: {
          scores: {
            include: {
              user: { select: { id: true } },
            },
          },
        },
      },
    },
    orderBy: { set: { createdAt: 'asc' } },
    take: MAX_SETS_TO_CONSIDER,
  });

  if (userScores.length === 0) return DEFAULT_RATING;

  let rating = DEFAULT_RATING;

  for (const userScore of userScores) {
    const set: SetWithScores = {
      ...userScore.set,
      scores: userScore.set.scores.map((s) => ({
        userId: s.userId,
        guestId: s.guestId,
        gamesWon: s.gamesWon,
        // Inject live ratings from the map for correct in-memory calculation
        user: s.userId
          ? { id: s.userId, rating: liveRatings?.get(s.userId) ?? null }
          : null,
      })),
    };

    const snapshotRatings = new Map(
      userScore.set.scores
        .filter((s) => s.userId)
        .map((s) => [s.userId!, liveRatings?.get(s.userId!) ?? rating])
    );

    const matchData = await calculateMatchRating(userId, set, rating, snapshotRatings);
    if (matchData) {
      rating = matchData.matchRating;
    }
  }

  return Math.max(MIN_RATING, Math.min(MAX_RATING, rating));
}

/**
 * Recalculate DSS ratings for ALL players in a specific group.
 */
export async function recalculateAllRatings(groupId?: string): Promise<Map<string, number>> {
  const allSets = await prisma.set.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - MATCH_AGE_LIMIT_DAYS * 24 * 60 * 60 * 1000),
      },
      ...(groupId ? { court: { session: { groupId } } } : {}),
    },
    include: {
      scores: {
        include: {
          user: { select: { id: true } },
        },
      },
      court: { select: { session: { select: { groupId: true } } } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const ratings = new Map<string, number>();
  const getRating = (userId: string) => ratings.get(userId) ?? DEFAULT_RATING;

  for (const rawSet of allSets) {
    const setGroupId = rawSet.court.session.groupId;

    const userIds = rawSet.scores
      .map((s) => s.userId)
      .filter((id): id is string => id !== null);

    const snapshotRatings = new Map<string, number>(
      userIds.map((id) => [id, getRating(id)])
    );

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

    const newRatings = new Map<string, number>();
    for (const userId of userIds) {
      const currentRating = getRating(userId);
      const matchData = await calculateMatchRating(userId, set, currentRating, snapshotRatings);
      if (matchData) {
        newRatings.set(userId, matchData.matchRating);
      }
    }

    for (const [id, rating] of newRatings) {
      ratings.set(id, rating);
    }

    // Persist after each set if we know the group
    if (setGroupId) {
      for (const [userId, rating] of newRatings) {
        await prisma.userGroup.updateMany({
          where: { userId, groupId: setGroupId },
          data: { rating, ratingUpdatedAt: new Date() },
        });
      }
    }
  }

  return ratings;
}

/**
 * Update a player's stored rating for a group and write a history entry.
 */
export async function updatePlayerRating(
  userId: string,
  groupId: string,
  setId: string | null = null
): Promise<number> {
  const previousRating = await getPlayerRating(userId, groupId);
  const newRating = await calculatePlayerRating(userId, groupId);

  let matchRating: number | null = null;
  if (setId) {
    const set = await prisma.set.findUnique({
      where: { id: setId },
      include: {
        scores: {
          include: { user: { select: { id: true } } },
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
          user: s.user ? { id: s.user.id, rating: null } : null,
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
            groupId,
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

  await prisma.userGroup.updateMany({
    where: { userId, groupId },
    data: { rating: newRating, ratingUpdatedAt: new Date() },
  });

  await prisma.ratingHistory.create({
    data: {
      userId,
      groupId,
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
    include: {
      scores: { select: { userId: true } },
      court: { select: { session: { select: { groupId: true } } } },
    },
  });

  if (!set) return;

  const groupId = set.court.session.groupId;
  if (!groupId) return;

  const userIds = Array.from(
    new Set(set.scores.map((s) => s.userId).filter((id): id is string => id !== null))
  );

  await Promise.all(userIds.map((userId) => updatePlayerRating(userId, groupId, setId)));
}

/**
 * Recalculate rating for a specific player in a group.
 */
export async function recalculatePlayerRating(userId: string, groupId: string): Promise<number> {
  return updatePlayerRating(userId, groupId);
}

/**
 * Get rating history for a player (optionally scoped to a group).
 */
export async function getRatingHistory(userId: string, groupId?: string) {
  return prisma.ratingHistory.findMany({
    where: { userId, ...(groupId ? { groupId } : {}) },
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
