import express, { Request, Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import { sessionService } from '../services/sessionService';
import { authenticateToken } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// All session routes require authentication
router.use(authenticateToken);

// Get all sessions
router.get(
  '/',
  [query('type').optional().isIn(['upcoming', 'past', 'all'])],
  async (req: Request, res: Response) => {
    try {
      const type = req.query.type as 'upcoming' | 'past' | 'all' | undefined;
      const sessions = await sessionService.getAllSessions({ type });
      res.json({ sessions });
    } catch (error) {
      console.error('Get sessions error:', error);
      res.status(500).json({ error: 'Failed to fetch sessions' });
    }
  }
);

// Get single session
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const session = await sessionService.getSessionById(req.params.id);
    res.json({ session });
  } catch (error) {
    if (error instanceof Error && error.message === 'Session not found') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Create session
router.post(
  '/',
  [
    body('date').isISO8601().withMessage('Valid date is required'),
    body('time')
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .withMessage('Time must be in HH:MM format'),
    body('venueName').trim().isLength({ min: 1, max: 200 }).withMessage('Venue name is required'),
    body('venueAddress').optional().trim().isLength({ max: 500 }),
    body('totalCost').optional().isFloat({ min: 0 }).withMessage('Cost must be a positive number'),
    body('notes').optional().trim().isLength({ max: 1000 }),
    body('courts').isArray({ min: 1 }).withMessage('At least one court is required'),
    body('courts.*.courtNumber').isInt({ min: 1 }).withMessage('Court number must be positive'),
    body('courts.*.startTime')
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .withMessage('Court start time must be in HH:MM format'),
    body('courts.*.duration').optional().isInt({ min: 30, max: 180 }).withMessage('Duration must be 30-180 minutes'),
    body('courts.*.cost').optional().isFloat({ min: 0 }).withMessage('Court cost must be a positive number'),
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

      // Check if user has permission to create sessions
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { canCreateSessions: true, isAdmin: true },
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Only admins and Full Seat Players can create sessions
      if (!user.isAdmin && !user.canCreateSessions) {
        return res.status(403).json({ error: 'As a Limited Seat Player, you cannot create sessions. Please contact an admin to upgrade your account.' });
      }

      const { date, time, venueName, venueAddress, totalCost, notes, courts } = req.body;

      // Validate date is not in the past
      const sessionDate = new Date(date);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      if (sessionDate < now) {
        return res.status(400).json({ error: 'Session date cannot be in the past' });
      }

      const session = await sessionService.createSession({
        date: sessionDate,
        time,
        venueName,
        venueAddress,
        totalCost: totalCost ? parseFloat(totalCost) : undefined,
        notes,
        courts,
        createdById: req.user.userId,
      });

      res.status(201).json({ session });
    } catch (error) {
      console.error('Create session error:', error);
      res.status(500).json({ error: 'Failed to create session' });
    }
  }
);

// Update session
router.put(
  '/:id',
  [
    body('date').optional().isISO8601().withMessage('Valid date is required'),
    body('time')
      .optional()
      .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .withMessage('Time must be in HH:MM format'),
    body('venueName').optional().trim().isLength({ min: 1, max: 200 }),
    body('venueAddress').optional().trim().isLength({ max: 500 }),
    body('totalCost').optional().isFloat({ min: 0 }),
    body('notes').optional().trim().isLength({ max: 1000 }),
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

      const { date, time, venueName, venueAddress, totalCost, notes } = req.body;

      const session = await sessionService.updateSession(req.params.id, req.user.userId, {
        ...(date && { date: new Date(date) }),
        ...(time && { time }),
        ...(venueName && { venueName }),
        ...(venueAddress !== undefined && { venueAddress }),
        ...(totalCost !== undefined && { totalCost: parseFloat(totalCost) }),
        ...(notes !== undefined && { notes }),
      });

      res.json({ session });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Session not found') {
          return res.status(404).json({ error: error.message });
        }
        if (error.message.includes('Only the session creator')) {
          return res.status(403).json({ error: error.message });
        }
      }
      console.error('Update session error:', error);
      res.status(500).json({ error: 'Failed to update session' });
    }
  }
);

// Delete session
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await sessionService.deleteSession(req.params.id, req.user.userId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Session not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Only the session creator')) {
        return res.status(403).json({ error: error.message });
      }
    }
    console.error('Delete session error:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

export default router;

