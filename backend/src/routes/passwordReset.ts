import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { passwordResetService } from '../services/passwordResetService';

const router = express.Router();

// Request password reset (send reset link)
router.post(
  '/request',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email } = req.body;
      const result = await passwordResetService.requestPasswordReset(email);
      
      // Always return 200 to prevent email enumeration
      res.json(result);
    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({ error: 'Failed to process password reset request' });
    }
  }
);

// Verify reset token
router.get('/verify/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const result = await passwordResetService.verifyResetToken(token);
    res.json(result);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Failed to verify reset token' });
  }
});

// Reset password with token
router.post(
  '/reset',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
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
      const { token, newPassword } = req.body;
      const result = await passwordResetService.resetPassword(token, newPassword);
      res.json(result);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Password reset error:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  }
);

export default router;

