import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authService } from '../services/authService';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Signup
router.post(
  '/signup',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('name').trim().isLength({ min: 1 }).withMessage('Name is required'),
    body('phone').optional().trim(),
    body('inviteCode').optional().trim(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password, name, phone, inviteCode } = req.body;
      const result = await authService.signup({ email, password, name, phone, inviteCode });
      
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          return res.status(409).json({ error: error.message });
        }
        if (error.message === 'Invalid invite code') {
          return res.status(400).json({ error: error.message });
        }
      }
      console.error('Signup error:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });
      
      res.json(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Invalid credentials') {
          return res.status(401).json({ error: error.message });
        }
      }
      console.error('Login error:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  }
);

// Switch active group — returns a new JWT with the selected groupId
router.post('/switch-group', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { groupId } = req.body;
    if (!groupId) {
      return res.status(400).json({ error: 'groupId is required' });
    }

    const result = await authService.switchGroup(req.user.userId, groupId);
    res.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Not a member of this group') {
      return res.status(403).json({ error: error.message });
    }
    console.error('Switch group error:', error);
    res.status(500).json({ error: 'Failed to switch group' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await authService.getUserById(req.user.userId);
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;

