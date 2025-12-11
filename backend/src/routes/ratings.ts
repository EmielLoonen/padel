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

// Calculate historical ratings for all players (admin only - one-time setup)
// This endpoint can be called via HTTP to calculate ratings without shell access
router.post('/calculate-historical', async (req: Request, res: Response) => {
  try {
    console.log('Starting historical rating calculation via API...');

    // Get all sets ordered by creation date (oldest first)
    const sets = await prisma.set.findMany({
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        createdAt: true,
        scores: {
          select: {
            userId: true,
          },
        },
      },
    });

    console.log(`Found ${sets.length} sets to process`);

    // Process each set chronologically
    let processed = 0;
    for (const set of sets) {
      try {
        // Get unique user IDs from this set
        const userIds = Array.from(
          new Set(
            set.scores
              .map((s) => s.userId)
              .filter((id): id is string => id !== null)
          )
        );

        if (userIds.length > 0) {
          // Recalculate ratings for all players in this set
          await recalculateRatingsForSet(set.id);
          processed++;

          if (processed % 10 === 0) {
            console.log(`Processed ${processed}/${sets.length} sets...`);
          }
        }
      } catch (error) {
        console.error(`Error processing set ${set.id}:`, error);
        // Continue with next set
      }
    }

    console.log(`\nCompleted! Processed ${processed} sets.`);

    // Get summary statistics
    const usersWithRatings = await prisma.user.count({
      where: {
        rating: {
          not: null,
        },
      },
    });

    const avgRating = await prisma.user.aggregate({
      where: {
        rating: {
          not: null,
        },
      },
      _avg: {
        rating: true,
      },
    });

    const topPlayers = await prisma.user.findMany({
      where: {
        rating: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        rating: true,
      },
      orderBy: {
        rating: 'desc',
      },
      take: 10,
    });

    res.json({
      success: true,
      message: 'Historical rating calculation completed',
      summary: {
        totalSets: sets.length,
        processedSets: processed,
        usersWithRatings,
        averageRating: avgRating._avg.rating ? Number(avgRating._avg.rating).toFixed(2) : 'N/A',
        topPlayers: topPlayers.map((p) => ({
          name: p.name,
          rating: p.rating ? Number(p.rating).toFixed(2) : null,
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

    const { calculateMatchPrediction } = await import('../services/ratingService');
    const prediction = await calculateMatchPrediction(team1PlayerIds, team2PlayerIds);

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
    const users = await prisma.user.findMany({
      where: {
        rating: {
          not: null,
        },
        name: {
          not: 'Guest Player',
        },
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        rating: true,
      },
      orderBy: {
        rating: 'desc',
      },
    });

    const leaderboard = users.map((user) => ({
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatarUrl,
      rating: user.rating ? Number(user.rating) : null,
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

    // Get user with rating
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        rating: true,
        ratingUpdatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get rating history
    const history = await getRatingHistory(userId);

    res.json({
      userId: user.id,
      name: user.name,
      rating: user.rating ? Number(user.rating) : null,
      ratingUpdatedAt: user.ratingUpdatedAt,
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

    const history = await getRatingHistory(userId);

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

    // Check if user is admin or requesting their own rating
    const requestingUser = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { isAdmin: true },
    });

    if (userId !== req.user.userId && !requestingUser?.isAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const newRating = await recalculatePlayerRating(userId);

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

