import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { guestService } from '../services/guestService';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All guest routes require authentication
router.use(authenticateToken);

// Add guest to court
router.post(
  '/court/:courtId',
  [body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Guest name is required')],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { name } = req.body;
      const guest = await guestService.addGuest(req.params.courtId, name, req.user.userId);

      res.status(201).json({ guest });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Court not found') {
          return res.status(404).json({ error: error.message });
        }
        if (error.message === 'Court is full') {
          return res.status(400).json({ error: error.message });
        }
      }
      console.error('Add guest error:', error);
      res.status(500).json({ error: 'Failed to add guest' });
    }
  }
);

// Remove guest
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await guestService.removeGuest(req.params.id, req.user.userId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Guest not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Only the person who added')) {
        return res.status(403).json({ error: error.message });
      }
    }
    console.error('Remove guest error:', error);
    res.status(500).json({ error: 'Failed to remove guest' });
  }
});

// Get guests for court
router.get('/court/:courtId', async (req: Request, res: Response) => {
  try {
    const guests = await guestService.getGuestsForCourt(req.params.courtId);
    res.json({ guests });
  } catch (error) {
    console.error('Get guests error:', error);
    res.status(500).json({ error: 'Failed to fetch guests' });
  }
});

export default router;

