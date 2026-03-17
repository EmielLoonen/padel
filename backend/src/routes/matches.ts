import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { recalculateRatingsForSet } from '../services/ratingService';
import { authenticateToken } from '../middleware/auth';

const prisma = new PrismaClient();
const router = express.Router();

interface WatchPlayer {
  code: string;        // A, B, C, D
  id: string;          // userId for registered, player name for guests
  type: 'registered' | 'guest';
  name: string;
}

interface WatchTeam {
  team: number;        // 1 or 2
  name: string;
  players: WatchPlayer[];
}

interface WatchSet {
  setNumber: number;
  team1Games: number;
  team2Games: number;
  winner: number | null;
  wasTiebreak: boolean;
  tiebreakScore: { team1: number; team2: number } | null;
}

interface WatchTeamStats {
  pointsWon: number;
  gamesWon: number;
  setsWon: number;
  serveWinPct: number | null;
  returnWinPct: number | null;
  breakPointOpportunities: number;
  breakPointsConverted: number;
  breakConversionPct: number | null;
  longestWinStreak: number;
  clutchPointsWon: number;
}

interface WatchPlayerStats {
  code: string;
  name: string;
  team: number;
  pointsWon: number;
  contributionPct: number | null;
  onServeWinPct: number | null;
  onReturnWinPct: number | null;
  serverWinPct: number | null;
  gameWinningPoints: number;
  setWinningPoints: number;
  clutchPoints: number;
  pointsBySet: Record<string, number>;
}

interface WatchMatchPayload {
  watchCode: string;
  matchId: string;
  startDate: string;
  endDate?: string;
  durationSeconds?: number;
  winner?: number;
  teams: WatchTeam[];
  sets: WatchSet[];
  stats: {
    team1: WatchTeamStats;
    team2: WatchTeamStats;
    players: Record<string, WatchPlayerStats>;
  };
  pointLog: object[];
}

/**
 * Resolve a watch player to a { userId, guestId } pair for SetScore creation.
 * For registered players uses their coordinator userId directly.
 * For guests, finds an existing guest by name in the session or creates one.
 */
async function resolvePlayer(
  player: WatchPlayer,
  sessionId: string,
  courtId: string,
  addedById: string
): Promise<{ userId: string | null; guestId: string | null }> {
  if (player.type === 'registered') {
    return { userId: player.id, guestId: null };
  }

  // Guest: look up by name in this session, create if not found
  let guest = await prisma.guest.findFirst({
    where: { sessionId, name: player.name },
  });

  if (!guest) {
    guest = await prisma.guest.create({
      data: {
        sessionId,
        courtId,
        name: player.name,
        addedById,
        status: 'yes',
      },
    });
  }

  return { userId: null, guestId: guest.id };
}

// POST /api/matches — submit a completed match from the watch app (no auth required)
router.post(
  '/',
  [
    body('watchCode').isString().notEmpty().withMessage('watchCode is required'),
    body('matchId').isUUID().withMessage('matchId must be a valid UUID'),
    body('startDate').isISO8601().withMessage('startDate must be a valid ISO 8601 date'),
    body('teams').isArray({ min: 2, max: 2 }).withMessage('teams must contain exactly 2 teams'),
    body('sets').isArray({ min: 1 }).withMessage('At least one set is required'),
    body('stats').exists().withMessage('stats is required'),
    body('pointLog').isArray().withMessage('pointLog must be an array'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const payload = req.body as WatchMatchPayload;
    const { watchCode, matchId, startDate, endDate, durationSeconds, winner, teams, sets, stats, pointLog } = payload;

    try {
      // Find court
      const court = await prisma.court.findUnique({
        where: { watchCode: watchCode.toUpperCase() },
        select: { id: true, session: { select: { id: true, createdById: true } } },
      });

      if (!court) {
        return res.status(404).json({ error: 'Court not found for given watchCode' });
      }

      // Idempotency: if this matchId was already stored, return success
      const existingMatch = await prisma.match.findUnique({ where: { matchId } });
      if (existingMatch) {
        return res.status(200).json({ matchId });
      }

      const allPlayers = teams.flatMap((t) => t.players.map((p) => ({ ...p, team: t.team })));
      const sessionId = court.session.id;
      const createdById = court.session.createdById;

      // Resolve each player to userId / guestId
      const resolvedPlayers = await Promise.all(
        allPlayers.map(async (p) => ({
          player: p,
          resolved: await resolvePlayer(p, sessionId, court.id, createdById),
        }))
      );

      // Create the Match record
      const match = await prisma.match.create({
        data: {
          matchId,
          courtId: court.id,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          durationSeconds: durationSeconds ?? null,
          winner: winner ?? null,
          pointLog: pointLog ?? [],
        },
      });

      // Create Set + SetScore records for each set, then link to match
      const createdSetIds: string[] = [];

      for (const s of sets) {
        const set = await prisma.set.create({
          data: {
            courtId: court.id,
            matchId: match.id,
            setNumber: s.setNumber,
            createdById,
            winner: s.winner ?? null,
            wasTiebreak: s.wasTiebreak ?? false,
            tiebreakTeam1: s.tiebreakScore?.team1 ?? null,
            tiebreakTeam2: s.tiebreakScore?.team2 ?? null,
            scores: {
              create: resolvedPlayers.map(({ player, resolved }) => ({
                userId: resolved.userId,
                guestId: resolved.guestId,
                gamesWon: player.team === 1 ? s.team1Games : s.team2Games,
              })),
            },
          },
        });

        createdSetIds.push(set.id);
      }

      // Trigger DSS rating recalculation for each set (async, don't block response)
      for (const setId of createdSetIds) {
        recalculateRatingsForSet(setId).catch((err) => {
          console.error(`Error recalculating ratings for set ${setId}:`, err);
        });
      }

      // Create team stats
      for (const teamNum of [1, 2] as const) {
        const teamInfo = teams.find((t) => t.team === teamNum);
        const teamStats = teamNum === 1 ? stats.team1 : stats.team2;

        await prisma.matchTeamStats.create({
          data: {
            matchId: match.id,
            team: teamNum,
            name: teamInfo?.name ?? `Team ${teamNum}`,
            pointsWon: teamStats.pointsWon,
            gamesWon: teamStats.gamesWon,
            setsWon: teamStats.setsWon,
            serveWinPct: teamStats.serveWinPct ?? null,
            returnWinPct: teamStats.returnWinPct ?? null,
            breakPointOpportunities: teamStats.breakPointOpportunities,
            breakPointsConverted: teamStats.breakPointsConverted,
            breakConversionPct: teamStats.breakConversionPct ?? null,
            longestWinStreak: teamStats.longestWinStreak,
            clutchPointsWon: teamStats.clutchPointsWon,
          },
        });
      }

      // Create player stats (only for players present in stats.players)
      for (const [code, playerStats] of Object.entries(stats.players)) {
        const player = allPlayers.find((p) => p.code === code);

        await prisma.matchPlayerStats.create({
          data: {
            matchId: match.id,
            code,
            name: playerStats.name,
            team: playerStats.team,
            userId: player?.type === 'registered' ? player.id : null,
            pointsWon: playerStats.pointsWon,
            contributionPct: playerStats.contributionPct ?? null,
            onServeWinPct: playerStats.onServeWinPct ?? null,
            onReturnWinPct: playerStats.onReturnWinPct ?? null,
            serverWinPct: playerStats.serverWinPct ?? null,
            gameWinningPoints: playerStats.gameWinningPoints,
            setWinningPoints: playerStats.setWinningPoints,
            clutchPoints: playerStats.clutchPoints,
            pointsBySet: playerStats.pointsBySet,
          },
        });
      }

      res.status(201).json({ matchId });
    } catch (error) {
      console.error('Submit match error:', error);
      res.status(500).json({ error: 'Failed to submit match' });
    }
  }
);

// GET /api/matches/:watchCode — retrieve all sets for a court by watch code (no auth required)
router.get('/:watchCode', async (req: Request, res: Response) => {
  try {
    const court = await prisma.court.findUnique({
      where: { watchCode: req.params.watchCode.toUpperCase() },
      select: { id: true },
    });

    if (!court) {
      return res.status(404).json({ error: 'Court not found for given watchCode' });
    }

    const sets = await prisma.set.findMany({
      where: { courtId: court.id },
      orderBy: { setNumber: 'asc' },
      include: {
        scores: {
          include: {
            user: { select: { id: true, name: true } },
            guest: { select: { id: true, name: true } },
          },
        },
      },
    });

    res.json({ sets });
  } catch (error) {
    console.error('Get match error:', error);
    res.status(500).json({ error: 'Failed to fetch match data' });
  }
});

// GET /api/matches/player-stats/:userId — aggregated watch stats for a player (auth required)
router.get('/player-stats/:userId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Fetch all player stats rows for this user across all matches
    const playerRows = await prisma.matchPlayerStats.findMany({
      where: { userId },
      include: {
        match: {
          include: {
            teamStats: true,
          },
        },
      },
    });

    if (playerRows.length === 0) {
      return res.json({ totalMatches: 0, stats: null });
    }

    // Helper: average of non-null Decimal/number values
    const avg = (values: (number | null | { toNumber(): number } | undefined)[]): number | null => {
      const nums = values
        .filter((v): v is number | { toNumber(): number } => v != null)
        .map((v) => (typeof v === 'number' ? v : v.toNumber()));
      return nums.length > 0 ? nums.reduce((s, n) => s + n, 0) / nums.length : null;
    };

    const sum = (values: (number | null | undefined)[]): number =>
      values.filter((v): v is number => v != null).reduce((s, n) => s + n, 0);

    // Per-player aggregates
    const totalMatches = playerRows.length;
    const totalPoints = sum(playerRows.map((r) => r.pointsWon));
    const avgContributionPct = avg(playerRows.map((r) => r.contributionPct));
    const avgServeWinPct = avg(playerRows.map((r) => r.onServeWinPct));
    const avgReturnWinPct = avg(playerRows.map((r) => r.onReturnWinPct));
    const avgServerWinPct = avg(playerRows.map((r) => r.serverWinPct));
    const totalGameWinningPoints = sum(playerRows.map((r) => r.gameWinningPoints));
    const totalSetWinningPoints = sum(playerRows.map((r) => r.setWinningPoints));
    const totalClutchPoints = sum(playerRows.map((r) => r.clutchPoints));

    // Team stats for the player's teams (one team stats row per match for their team)
    const teamStatRows = playerRows
      .map((r) => r.match.teamStats.find((t) => t.team === r.team))
      .filter((t): t is NonNullable<typeof t> => t != null);

    const totalBreakPointOpportunities = sum(teamStatRows.map((t) => t.breakPointOpportunities));
    const totalBreakPointsConverted = sum(teamStatRows.map((t) => t.breakPointsConverted));
    const avgBreakConversionPct = avg(teamStatRows.map((t) => t.breakConversionPct));
    const avgTeamServeWinPct = avg(teamStatRows.map((t) => t.serveWinPct));
    const avgTeamReturnWinPct = avg(teamStatRows.map((t) => t.returnWinPct));
    const maxLongestWinStreak = teamStatRows.length > 0
      ? Math.max(...teamStatRows.map((t) => t.longestWinStreak))
      : null;

    res.json({
      totalMatches,
      stats: {
        totalPoints,
        avgContributionPct,
        avgServeWinPct,
        avgReturnWinPct,
        avgServerWinPct,
        totalGameWinningPoints,
        totalSetWinningPoints,
        totalClutchPoints,
        totalBreakPointOpportunities,
        totalBreakPointsConverted,
        avgBreakConversionPct,
        avgTeamServeWinPct,
        avgTeamReturnWinPct,
        maxLongestWinStreak,
      },
    });
  } catch (error) {
    console.error('Get player match stats error:', error);
    res.status(500).json({ error: 'Failed to fetch player match stats' });
  }
});

export default router;
