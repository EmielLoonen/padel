import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { courtService } from '../services/courtService';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All court routes require authentication
router.use(authenticateToken);

// Update a court
router.put(
  '/:id',
  [
    body('courtNumber').optional().isInt({ min: 1 }).withMessage('Court number must be positive'),
    body('startTime')
      .optional()
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .withMessage('Start time must be in HH:MM format'),
    body('duration').optional().isInt({ min: 30, max: 180 }).withMessage('Duration must be 30-180 minutes'),
    body('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be a positive number'),
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

      const { courtNumber, startTime, duration, cost } = req.body;
      const court = await courtService.updateCourt(req.params.id, req.user.userId, {
        courtNumber,
        startTime,
        duration,
        cost,
      });

      res.json({ court });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Court not found') {
          return res.status(404).json({ error: error.message });
        }
        if (error.message.includes('Only the session creator')) {
          return res.status(403).json({ error: error.message });
        }
      }
      console.error('Update court error:', error);
      res.status(500).json({ error: 'Failed to update court' });
    }
  }
);

// Delete a court
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await courtService.deleteCourt(req.params.id, req.user.userId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Court not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Only the session creator')) {
        return res.status(403).json({ error: error.message });
      }
      if (error.message.includes('Cannot delete')) {
        return res.status(400).json({ error: error.message });
      }
    }
    console.error('Delete court error:', error);
    res.status(500).json({ error: 'Failed to delete court' });
  }
});

export default router;

