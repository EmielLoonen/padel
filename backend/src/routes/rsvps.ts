import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { rsvpService } from '../services/rsvpService';
import { authenticateToken } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// All RSVP routes require authentication
router.use(authenticateToken);

// Get all RSVPs for a session
router.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const result = await rsvpService.getRSVPsForSession(req.params.sessionId);
    res.json(result); // Returns { rsvps, summary, courtsInfo }
  } catch (error) {
    console.error('Get RSVPs error:', error);
    res.status(500).json({ error: 'Failed to fetch RSVPs' });
  }
});

// Create or update RSVP
router.post(
  '/session/:sessionId',
  [
    body('status').isIn(['yes', 'no', 'maybe']).withMessage('Status must be yes, no, or maybe'),
    body('courtId').optional({ nullable: true }).isString().withMessage('Court ID must be a string'),
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

      // Check if user has permission to RSVP (canCreateSessions or isAdmin)
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { canCreateSessions: true, isAdmin: true },
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Limited Seat Players cannot RSVP (admins and Full Seat Players can RSVP)
      if (!user.isAdmin && !user.canCreateSessions) {
        return res.status(403).json({ 
          error: 'As a Limited Seat Player, you cannot RSVP to sessions. Please contact an admin or a Full Seat Player to be added to a session.' 
        });
      }

      const { status, courtId } = req.body;
      const result = await rsvpService.createOrUpdateRSVP(
        req.params.sessionId,
        req.user.userId,
        status,
        courtId
      );

      res.json({ rsvp: result.rsvp, overlaps: result.overlaps });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Session not found' || error.message === 'Court not found') {
          return res.status(404).json({ error: error.message });
        }
        if (error.message === 'Court is full') {
          return res.status(400).json({ error: error.message });
        }
      }
      console.error('Create/Update RSVP error:', error);
      res.status(500).json({ error: 'Failed to save RSVP' });
    }
  }
);

// Delete RSVP
router.delete('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await rsvpService.deleteRSVP(req.params.sessionId, req.user.userId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === 'RSVP not found') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Delete RSVP error:', error);
    res.status(500).json({ error: 'Failed to delete RSVP' });
  }
});

export default router;

