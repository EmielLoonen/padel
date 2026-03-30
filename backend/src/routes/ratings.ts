import express, { Request, Response } from 'express';
import {
  getRatingHistory,
  recalculatePlayerRating,
  getMatchRating,
  recalculateRatingsForSet,
} from '../services/ratingService';
import { authenticateToken } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// All rating routes require authentication
router.use(authenticateToken);

// Middleware to check if user is admin (uses req.user resolved by auth middleware)
const requireAdmin = (req: any, res: Response, next: any) => {
  if (!req.user?.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Check admin status (for debugging)
router.get('/check-admin', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', isAdmin: false });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { email: true, name: true },
    });

    res.json({
      isAdmin: req.user.isAdmin,
      email: user?.email,
      name: user?.name,
    });
  } catch (error) {
    console.error('Check admin error:', error);
    res.status(500).json({
      error: 'Failed to check admin status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Reset all ratings to 5.0 (preserves historical data) (admin only)
router.post('/reset', requireAdmin, async (req: Request, res: Response) => {
  try {
    const DEFAULT_RATING = 5.0;
    const groupId = req.user?.groupId;

    console.log('Reset ratings request received from user:', req.user?.userId);

    // Get counts before reset
    const ugBeforeReset = groupId
      ? await prisma.userGroup.count({ where: { groupId } })
      : await prisma.userGroup.count();
    const ugWithRatingsBefore = await prisma.userGroup.count({
      where: {
        ...(groupId ? { groupId } : {}),
        rating: { not: null },
      },
    });

    // Reset all player ratings to DEFAULT_RATING in UserGroup
    const resetResult = await prisma.userGroup.updateMany({
      where: groupId ? { groupId } : {},
      data: {
        rating: DEFAULT_RATING,
        ratingUpdatedAt: new Date(),
      },
    });

    console.log('Reset result:', resetResult);

    // Verify the reset worked
    const ugWithRatingsAfter = await prisma.userGroup.count({
      where: {
        ...(groupId ? { groupId } : {}),
        rating: { not: null },
      },
    });

    // Get a sample of updated UserGroup entries to verify
    const sampleEntries = await prisma.userGroup.findMany({
      where: groupId ? { groupId } : {},
      take: 5,
      select: {
        userId: true,
        rating: true,
        user: { select: { name: true, email: true } },
      },
    });

    const historyCount = await prisma.ratingHistory.count({});
    const matchRatingsCount = await prisma.matchRating.count({});

    res.json({
      success: true,
      message: 'All ratings reset to 5.0 (historical data preserved)',
      summary: {
        playersReset: resetResult.count,
        totalUsers: ugBeforeReset,
        usersWithRatingsBefore: ugWithRatingsBefore,
        usersWithRatingsAfter: ugWithRatingsAfter,
        sampleUsers: sampleEntries.map((e) => ({
          id: e.userId,
          name: e.user.name,
          email: e.user.email,
          rating: e.rating,
        })),
        historicalDataPreserved: {
          ratingHistoryEntries: historyCount,
          matchRatingEntries: matchRatingsCount,
        },
      },
    });
  } catch (error) {
    console.error('Reset ratings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset ratings',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
});

// Calculate historical ratings for all players (admin only - one-time setup)
router.post('/calculate-historical', async (req: Request, res: Response) => {
  try {
    console.log('Starting historical rating calculation via API...');

    // Get all sets ordered by creation date (oldest first)
    const sets = await prisma.set.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        createdAt: true,
        scores: { select: { userId: true } },
      },
    });

    console.log(`Found ${sets.length} sets to process`);

    let processed = 0;
    for (const set of sets) {
      try {
        const userIds = Array.from(
          new Set(
            set.scores
              .map((s) => s.userId)
              .filter((id): id is string => id !== null)
          )
        );

        if (userIds.length > 0) {
          await recalculateRatingsForSet(set.id);
          processed++;
          if (processed % 10 === 0) {
            console.log(`Processed ${processed}/${sets.length} sets...`);
          }
        }
      } catch (error) {
        console.error(`Error processing set ${set.id}:`, error);
      }
    }

    console.log(`\nCompleted! Processed ${processed} sets.`);

    // Get summary statistics from UserGroup
    const groupId = req.user?.groupId;
    const ugWithRatings = await prisma.userGroup.findMany({
      where: {
        ...(groupId ? { groupId } : {}),
        rating: { not: null },
      },
      select: { rating: true, user: { select: { name: true } } },
      orderBy: { rating: 'desc' },
      take: 10,
    });

    const usersWithRatings = await prisma.userGroup.count({
      where: {
        ...(groupId ? { groupId } : {}),
        rating: { not: null },
      },
    });

    const ratings = ugWithRatings
      .map((e) => (e.rating ? Number(e.rating) : null))
      .filter((r): r is number => r !== null);
    const avgRating =
      ratings.length > 0
        ? (ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(2)
        : 'N/A';

    res.json({
      success: true,
      message: 'Historical rating calculation completed',
      summary: {
        totalSets: sets.length,
        processedSets: processed,
        usersWithRatings,
        averageRating: avgRating,
        topPlayers: ugWithRatings.map((e) => ({
          name: e.user.name,
          rating: e.rating ? Number(e.rating).toFixed(2) : null,
        })),
      },
    });
  } catch (error) {
    console.error('Historical rating calculation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate historical ratings',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Predict match outcome for two teams
router.post('/predict-match', async (req: Request, res: Response) => {
  try {
    const { team1PlayerIds, team2PlayerIds } = req.body;

    if (!team1PlayerIds || !team2PlayerIds || !Array.isArray(team1PlayerIds) || !Array.isArray(team2PlayerIds)) {
      return res.status(400).json({ error: 'team1PlayerIds and team2PlayerIds arrays are required' });
    }

    if (team1PlayerIds.length !== 2 || team2PlayerIds.length !== 2) {
      return res.status(400).json({ error: 'Each team must have exactly 2 players' });
    }

    const groupId = req.user?.groupId;
    if (!groupId) {
      return res.status(400).json({ error: 'No active group' });
    }

    const { calculateMatchPrediction } = await import('../services/ratingService');
    const prediction = await calculateMatchPrediction(team1PlayerIds, team2PlayerIds, groupId);

    if (!prediction) {
      return res.status(400).json({ error: 'Failed to calculate prediction' });
    }

    res.json({ prediction });
  } catch (error) {
    console.error('Predict match error:', error);
    res.status(500).json({ error: 'Failed to predict match outcome' });
  }
});

// Get leaderboard sorted by rating (must be before /:userId route)
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const groupId = req.user?.isSuperAdmin ? undefined : req.user?.groupId;

    const entries = await prisma.userGroup.findMany({
      where: {
        ...(groupId ? { groupId } : {}),
        rating: { not: null },
        user: { name: { not: 'Guest Player' } },
      },
      select: {
        userId: true,
        rating: true,
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { rating: 'desc' },
    });

    const leaderboard = entries.map((e) => ({
      userId: e.user.id,
      userName: e.user.name,
      userAvatar: e.user.avatarUrl,
      rating: e.rating ? Number(e.rating) : null,
    }));

    res.json({ leaderboard });
  } catch (error) {
    console.error('Get rating leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch rating leaderboard' });
  }
});

// Get current rating and history for a user
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const groupId = req.user?.groupId ?? undefined;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get rating from UserGroup
    const membership = groupId
      ? await prisma.userGroup.findUnique({
          where: { userId_groupId: { userId, groupId } },
          select: { rating: true, ratingUpdatedAt: true },
        })
      : null;

    const history = await getRatingHistory(userId, groupId);

    res.json({
      userId: user.id,
      name: user.name,
      rating: membership?.rating ? Number(membership.rating) : null,
      ratingUpdatedAt: membership?.ratingUpdatedAt ?? null,
      history,
    });
  } catch (error) {
    console.error('Get rating error:', error);
    res.status(500).json({ error: 'Failed to fetch rating' });
  }
});

// Get rating history for a user
router.get('/:userId/history', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const groupId = req.user?.groupId ?? undefined;

    const history = await getRatingHistory(userId, groupId);

    res.json({ history });
  } catch (error) {
    console.error('Get rating history error:', error);
    res.status(500).json({ error: 'Failed to fetch rating history' });
  }
});

// Get match rating details for a specific set
router.get('/:userId/match/:setId', async (req: Request, res: Response) => {
  try {
    const { userId, setId } = req.params;

    const matchRating = await getMatchRating(userId, setId);

    if (!matchRating) {
      return res.status(404).json({ error: 'Match rating not found' });
    }

    res.json({ matchRating });
  } catch (error) {
    console.error('Get match rating error:', error);
    res.status(500).json({ error: 'Failed to fetch match rating' });
  }
});

// Recalculate rating for a specific player (admin only or self)
router.post('/:userId/recalculate', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { userId } = req.params;
    const groupId = req.user.groupId;

    // Check if user is admin or requesting their own rating
    if (userId !== req.user.userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!groupId) {
      return res.status(400).json({ error: 'No active group' });
    }

    const newRating = await recalculatePlayerRating(userId, groupId);

    res.json({
      userId,
      rating: newRating,
      message: 'Rating recalculated successfully',
    });
  } catch (error) {
    console.error('Recalculate rating error:', error);
    res.status(500).json({ error: 'Failed to recalculate rating' });
  }
});

export default router;
