import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { setService } from '../services/setService';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All set routes require authentication
router.use(authenticateToken);

// Get leaderboard
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const leaderboard = await setService.getLeaderboard();
    res.json({ leaderboard });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get sets for a session
router.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const sets = await setService.getSetsBySession(req.params.sessionId);
    res.json({ sets });
  } catch (error) {
    console.error('Get sets error:', error);
    res.status(500).json({ error: 'Failed to fetch sets' });
  }
});

// Get single set
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const set = await setService.getSetById(req.params.id);
    res.json({ set });
  } catch (error) {
    if (error instanceof Error && error.message === 'Set not found') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Get set error:', error);
    res.status(500).json({ error: 'Failed to fetch set' });
  }
});

// Create set
router.post(
  '/',
  [
    body('courtId').isString().withMessage('Court ID is required'),
    body('setNumber').isInt({ min: 1 }).withMessage('Set number must be a positive integer'),
    body('scores').isArray({ min: 1 }).withMessage('At least one player score is required'),
    body('scores.*.userId').isString().withMessage('User ID is required for each score'),
    body('scores.*.gamesWon').isInt({ min: 0 }).withMessage('Games won must be a positive integer'),
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

      const { courtId, setNumber, scores } = req.body;

      const set = await setService.createSet({
        courtId,
        setNumber,
        scores,
        createdById: req.user.userId,
      });

      res.status(201).json({ set });
    } catch (error) {
      console.error('Create set error:', error);
      res.status(500).json({ error: 'Failed to create set' });
    }
  }
);

// Update set
router.put(
  '/:id',
  [
    body('scores').optional().isArray({ min: 1 }).withMessage('At least one player score is required'),
    body('scores.*.userId').optional().isString().withMessage('User ID is required for each score'),
    body('scores.*.gamesWon').optional().isInt({ min: 0 }).withMessage('Games won must be a positive integer'),
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

      const { scores } = req.body;

      const set = await setService.updateSet(req.params.id, req.user.userId, {
        scores,
      });

      res.json({ set });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Set not found') {
          return res.status(404).json({ error: error.message });
        }
        if (error.message.includes('Only the set creator')) {
          return res.status(403).json({ error: error.message });
        }
      }
      console.error('Update set error:', error);
      res.status(500).json({ error: 'Failed to update set' });
    }
  }
);

// Delete set
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await setService.deleteSet(req.params.id, req.user.userId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Set not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Only the set creator')) {
        return res.status(403).json({ error: error.message });
      }
    }
    console.error('Delete set error:', error);
    res.status(500).json({ error: 'Failed to delete set' });
  }
});

// Get player stats
router.get('/stats/:userId', async (req: Request, res: Response) => {
  try {
    const stats = await setService.getPlayerStats(req.params.userId);
    res.json({ stats });
  } catch (error) {
    console.error('Get player stats error:', error);
    res.status(500).json({ error: 'Failed to fetch player stats' });
  }
});

// Get set history for a user
router.get('/history/:userId', async (req: Request, res: Response) => {
  try {
    const sets = await setService.getSetHistoryForUser(req.params.userId);
    res.json({ sets });
  } catch (error) {
    console.error('Get set history error:', error);
    res.status(500).json({ error: 'Failed to fetch set history' });
  }
});

export default router;

