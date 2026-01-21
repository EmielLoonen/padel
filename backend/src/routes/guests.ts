import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { guestService } from '../services/guestService';
import { authenticateToken } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const router = express.Router();

// All guest routes require authentication
router.use(authenticateToken);

// Add guest to session
router.post(
  '/session/:sessionId',
  [
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Guest name is required'),
    body('status').isIn(['yes', 'no', 'maybe']).withMessage('Status must be yes, no, or maybe'),
    body('courtId').optional({ nullable: true }),
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

      // Check if user has permission to add guests (admins and Full Seat Players can add guests)
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { canCreateSessions: true, isAdmin: true },
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Limited Seat Players cannot add guests
      if (!user.isAdmin && !user.canCreateSessions) {
        return res.status(403).json({ 
          error: 'As a Limited Seat Player, you cannot add guest players. Please contact an admin or a Full Seat Player.' 
        });
      }

      const { name, status, courtId } = req.body;
      const guest = await guestService.addGuest(
        req.params.sessionId, 
        courtId || null, 
        name, 
        status, 
        req.user.userId
      );

      res.status(201).json({ guest });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Court not found') {
          return res.status(404).json({ error: error.message });
        }
        if (error.message === 'Court is full') {
          return res.status(400).json({ error: error.message });
        }
        if (error.message.includes('Invalid status')) {
          return res.status(400).json({ error: error.message });
        }
      }
      console.error('Add guest error:', error);
      res.status(500).json({ error: 'Failed to add guest' });
    }
  }
);

// Update guest status (legacy route for backward compatibility)
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

      // Check if user has permission to add guests (admins and Full Seat Players can add guests)
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { canCreateSessions: true, isAdmin: true },
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Limited Seat Players cannot add guests
      if (!user.isAdmin && !user.canCreateSessions) {
        return res.status(403).json({ 
          error: 'As a Limited Seat Player, you cannot add guest players. Please contact an admin or a Full Seat Player.' 
        });
      }

      // Get session ID from court
      const court = await prisma.court.findUnique({
        where: { id: req.params.courtId },
        select: { sessionId: true },
      });

      if (!court) {
        return res.status(404).json({ error: 'Court not found' });
      }

      const { name } = req.body;
      const guest = await guestService.addGuest(
        court.sessionId, 
        req.params.courtId, 
        name, 
        'yes', 
        req.user.userId
      );

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

// Update guest status
router.patch(
  '/:id/status',
  [
    body('status').isIn(['yes', 'no', 'maybe']).withMessage('Status must be yes, no, or maybe'),
    body('courtId').optional({ nullable: true }),
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

      const { status, courtId } = req.body;
      const guest = await guestService.updateGuestStatus(
        req.params.id,
        status,
        courtId || null,
        req.user.userId
      );

      res.json({ guest });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Guest not found') {
          return res.status(404).json({ error: error.message });
        }
        if (error.message === 'Court not found') {
          return res.status(404).json({ error: error.message });
        }
        if (error.message === 'Court is full') {
          return res.status(400).json({ error: error.message });
        }
        if (error.message.includes('Invalid status')) {
          return res.status(400).json({ error: error.message });
        }
        if (error.message.includes('Only the person who added')) {
          return res.status(403).json({ error: error.message });
        }
      }
      console.error('Update guest status error:', error);
      res.status(500).json({ error: 'Failed to update guest status' });
    }
  }
);

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

// Get guests for session
router.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const guests = await guestService.getGuestsForSession(req.params.sessionId);
    res.json({ guests });
  } catch (error) {
    console.error('Get guests error:', error);
    res.status(500).json({ error: 'Failed to fetch guests' });
  }
});

export default router;

