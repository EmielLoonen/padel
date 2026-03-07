import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { setService } from '../services/setService';

const prisma = new PrismaClient();
const router = express.Router();

function toInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

// GET /api/watch/:code — fetch court + players by watch code (no auth required)
router.get('/:code', async (req: Request, res: Response) => {
  try {
    const court = await prisma.court.findUnique({
      where: { watchCode: req.params.code.toUpperCase() },
      include: {
        session: {
          select: { date: true, time: true, venueName: true },
        },
        rsvps: {
          where: { status: 'yes' },
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        guests: {
          where: { status: 'yes' },
          select: { id: true, name: true },
        },
      },
    });

    if (!court) {
      return res.status(404).json({ error: 'Court not found' });
    }

    const players = [
      ...court.rsvps.map((r) => ({ id: r.user.id, initials: toInitials(r.user.name), type: 'user' as const })),
      ...court.guests.map((g) => ({ id: g.id, initials: toInitials(g.name), type: 'guest' as const })),
    ];

    res.json({
      courtId: court.id,
      courtNumber: court.courtNumber,
      session: {
        date: court.session.date,
        time: court.session.time,
        venue: court.session.venueName,
      },
      players,
    });
  } catch (error) {
    console.error('Watch get court error:', error);
    res.status(500).json({ error: 'Failed to fetch court' });
  }
});

// POST /api/watch/:code/score — submit a set score (no auth required)
router.post(
  '/:code/score',
  [
    body('setNumber').isInt({ min: 1 }).withMessage('Set number must be a positive integer'),
    body('scores').isArray({ min: 1 }).withMessage('At least one score is required'),
    body('scores.*.id').isString().withMessage('Player id is required'),
    body('scores.*.type').isIn(['user', 'guest']).withMessage('Type must be user or guest'),
    body('scores.*.gamesWon').isInt({ min: 0 }).withMessage('Games won must be a non-negative integer'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const court = await prisma.court.findUnique({
        where: { watchCode: req.params.code.toUpperCase() },
        select: { id: true, session: { select: { createdById: true } } },
      });

      if (!court) {
        return res.status(404).json({ error: 'Court not found' });
      }

      const { setNumber, scores } = req.body;

      const set = await setService.createSet({
        courtId: court.id,
        setNumber,
        scores: scores.map((s: { id: string; type: 'user' | 'guest'; gamesWon: number }) => ({
          ...(s.type === 'user' ? { userId: s.id } : { guestId: s.id }),
          gamesWon: s.gamesWon,
        })),
        createdById: court.session.createdById,
      });

      res.status(201).json({ set });
    } catch (error) {
      console.error('Watch submit score error:', error);
      res.status(500).json({ error: 'Failed to submit score' });
    }
  }
);

export default router;
