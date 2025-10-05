import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { rsvpService } from '../services/rsvpService';
import { authenticateToken } from '../middleware/auth';

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

      const { status, courtId } = req.body;
      const rsvp = await rsvpService.createOrUpdateRSVP(
        req.params.sessionId,
        req.user.userId,
        status,
        courtId
      );

      res.json({ rsvp });
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

