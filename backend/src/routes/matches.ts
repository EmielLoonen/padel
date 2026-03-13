import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { setService } from '../services/setService';

const prisma = new PrismaClient();
const router = express.Router();

// POST /api/matches — submit a full match (all sets) by watch code (no auth required)
router.post(
  '/',
  [
    body('watchCode').isString().notEmpty().withMessage('watchCode is required'),
    body('sets').isArray({ min: 1 }).withMessage('At least one set is required'),
    body('sets.*.setNumber').isInt({ min: 1 }).withMessage('setNumber must be a positive integer'),
    body('sets.*.scores').isArray({ min: 1 }).withMessage('At least one score per set is required'),
    body('sets.*.scores.*.id').isString().withMessage('Player id is required'),
    body('sets.*.scores.*.type').isIn(['user', 'guest']).withMessage('Type must be user or guest'),
    body('sets.*.scores.*.gamesWon').isInt({ min: 0 }).withMessage('gamesWon must be a non-negative integer'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { watchCode, sets } = req.body as {
      watchCode: string;
      sets: Array<{
        setNumber: number;
        scores: Array<{ id: string; type: 'user' | 'guest'; gamesWon: number }>;
      }>;
    };

    try {
      const court = await prisma.court.findUnique({
        where: { watchCode: watchCode.toUpperCase() },
        select: { id: true, session: { select: { createdById: true } } },
      });

      if (!court) {
        return res.status(404).json({ error: 'Court not found for given watchCode' });
      }

      const createdSets = await Promise.all(
        sets.map((s) =>
          setService.createSet({
            courtId: court.id,
            setNumber: s.setNumber,
            scores: s.scores.map((score) => ({
              userId: score.id,
              gamesWon: score.gamesWon,
            })),
            createdById: court.session.createdById,
          })
        )
      );

      res.status(201).json({ sets: createdSets });
    } catch (error) {
      console.error('Submit match error:', error);
      res.status(500).json({ error: 'Failed to submit match' });
    }
  }
);

// GET /api/matches/:watchCode — retrieve all sets for a court by watch code (no auth required)
router.get('/:watchCode', async (req: Request, res: Response) => {
  try {
    const court = await prisma.court.findUnique({
      where: { watchCode: req.params.watchCode.toUpperCase() },
      select: { id: true },
    });

    if (!court) {
      return res.status(404).json({ error: 'Court not found for given watchCode' });
    }

    const sets = await prisma.set.findMany({
      where: { courtId: court.id },
      orderBy: { setNumber: 'asc' },
      include: {
        scores: {
          include: {
            user: { select: { id: true, name: true } },
            guest: { select: { id: true, name: true } },
          },
        },
      },
    });

    res.json({ sets });
  } catch (error) {
    console.error('Get match error:', error);
    res.status(500).json({ error: 'Failed to fetch match data' });
  }
});

export default router;
