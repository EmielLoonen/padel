import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { rsvpService } from '../services/rsvpService';

const router = express.Router();
const prisma = new PrismaClient();

// All admin routes require authentication
router.use(authenticateToken);

// Middleware to check if user is admin
const requireAdmin = async (req: any, res: Response, next: any) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Failed to verify admin status' });
  }
};

// Get all users (admin only)
router.get('/users', requireAdmin, async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatarUrl: true,
        isAdmin: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Reset user password (admin only)
router.post(
  '/reset-user-password',
  requireAdmin,
  [
    body('userId').isString().withMessage('User ID is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { userId, newPassword } = req.body;

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Hash the new password
      const passwordHash = await bcrypt.hash(newPassword, 10);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      });

      res.json({
        success: true,
        message: `Password reset successfully for ${user.name} (${user.email})`,
      });
    } catch (error) {
      console.error('Reset user password error:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  }
);

// Add user to session (admin only)
router.post(
  '/sessions/:sessionId/add-user',
  requireAdmin,
  [
    body('userId').isString().withMessage('User ID is required'),
    body('status').isIn(['yes', 'no', 'maybe']).withMessage('Status must be yes, no, or maybe'),
    body('courtId').optional({ nullable: true }).isString().withMessage('Court ID must be a string'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { sessionId } = req.params;
      const { userId, status, courtId } = req.body;

      const rsvp = await rsvpService.createOrUpdateRSVP(
        sessionId,
        userId,
        status as 'yes' | 'no' | 'maybe',
        courtId || null
      );

      res.json({ rsvp, message: 'User added to session successfully' });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Session not found' || error.message === 'Court not found') {
          return res.status(404).json({ error: error.message });
        }
        if (error.message === 'Court is full') {
          return res.status(400).json({ error: error.message });
        }
      }
      console.error('Add user to session error:', error);
      res.status(500).json({ error: 'Failed to add user to session' });
    }
  }
);

// Remove user from session (admin only)
router.delete(
  '/sessions/:sessionId/remove-user/:userId',
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { sessionId, userId } = req.params;

      await rsvpService.deleteRSVP(sessionId, userId);

      res.json({ message: 'User removed from session successfully' });
    } catch (error) {
      if (error instanceof Error && error.message === 'RSVP not found') {
        return res.status(404).json({ error: error.message });
      }
      console.error('Remove user from session error:', error);
      res.status(500).json({ error: 'Failed to remove user from session' });
    }
  }
);

export default router;

