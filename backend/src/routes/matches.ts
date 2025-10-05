import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { matchService } from '../services/matchService';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All match routes require authentication
router.use(authenticateToken);

// Get leaderboard
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const leaderboard = await matchService.getLeaderboard();
    res.json({ leaderboard });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get matches for a session
router.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const matches = await matchService.getMatchesBySession(req.params.sessionId);
    res.json({ matches });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// Get single match
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const match = await matchService.getMatchById(req.params.id);
    res.json({ match });
  } catch (error) {
    if (error instanceof Error && error.message === 'Match not found') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Get match error:', error);
    res.status(500).json({ error: 'Failed to fetch match' });
  }
});

// Create match
router.post(
  '/',
  [
    body('courtId').isString().withMessage('Court ID is required'),
    body('team1Player1Id').isString().withMessage('Team 1 Player 1 ID is required'),
    body('team1Player2Id').isString().withMessage('Team 1 Player 2 ID is required'),
    body('team2Player1Id').isString().withMessage('Team 2 Player 1 ID is required'),
    body('team2Player2Id').isString().withMessage('Team 2 Player 2 ID is required'),
    body('sets').isArray({ min: 1 }).withMessage('At least one set is required'),
    body('sets.*.team1').isInt({ min: 0 }).withMessage('Set scores must be positive integers'),
    body('sets.*.team2').isInt({ min: 0 }).withMessage('Set scores must be positive integers'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const {
        courtId,
        team1Player1Id,
        team1Player2Id,
        team2Player1Id,
        team2Player2Id,
        sets,
      } = req.body;

      const match = await matchService.createMatch({
        courtId,
        team1Player1Id,
        team1Player2Id,
        team2Player1Id,
        team2Player2Id,
        sets,
        createdById: req.user.userId,
      });

      res.status(201).json({ match });
    } catch (error) {
      if (error instanceof Error && error.message.includes('All 4 players must be unique')) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Create match error:', error);
      res.status(500).json({ error: 'Failed to create match' });
    }
  }
);

// Update match
router.put(
  '/:id',
  [
    body('sets').optional().isArray({ min: 1 }).withMessage('At least one set is required'),
    body('sets.*.team1').optional().isInt({ min: 0 }).withMessage('Set scores must be positive integers'),
    body('sets.*.team2').optional().isInt({ min: 0 }).withMessage('Set scores must be positive integers'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { sets } = req.body;

      const match = await matchService.updateMatch(req.params.id, req.user.userId, {
        sets,
      });

      res.json({ match });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Match not found') {
          return res.status(404).json({ error: error.message });
        }
        if (error.message.includes('Only the match creator')) {
          return res.status(403).json({ error: error.message });
        }
      }
      console.error('Update match error:', error);
      res.status(500).json({ error: 'Failed to update match' });
    }
  }
);

// Delete match
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await matchService.deleteMatch(req.params.id, req.user.userId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Match not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Only the match creator')) {
        return res.status(403).json({ error: error.message });
      }
    }
    console.error('Delete match error:', error);
    res.status(500).json({ error: 'Failed to delete match' });
  }
});

// Get player stats
router.get('/stats/:userId', async (req: Request, res: Response) => {
  try {
    const stats = await matchService.getPlayerStats(req.params.userId);
    res.json({ stats });
  } catch (error) {
    console.error('Get player stats error:', error);
    res.status(500).json({ error: 'Failed to fetch player stats' });
  }
});

export default router;
