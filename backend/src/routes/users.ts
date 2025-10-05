import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { userService } from '../services/userService';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = express.Router();

// All user routes require authentication
router.use(authenticateToken);

// Change password
router.post(
  '/change-password',
  [
    body('currentPassword').isString().isLength({ min: 1 }).withMessage('Current password is required'),
    body('newPassword')
      .isString()
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters'),
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

      const { currentPassword, newPassword } = req.body;

      await userService.changePassword(req.user.userId, currentPassword, newPassword);

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'User not found') {
          return res.status(404).json({ error: error.message });
        }
        if (error.message === 'Current password is incorrect') {
          return res.status(400).json({ error: error.message });
        }
      }
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  }
);

// Update profile
router.put(
  '/profile',
  [
    body('name').optional().isString().trim().isLength({ min: 1, max: 100 }),
    body('phone').optional().isString().trim(),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('currentPassword').optional().isString(),
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

      const { name, phone, email, currentPassword } = req.body;

      const user = await userService.updateProfile(
        req.user.userId,
        { name, phone, email },
        currentPassword
      );

      res.json({ user });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'User not found') {
          return res.status(404).json({ error: error.message });
        }
        if (error.message === 'Password is required to change email' || error.message === 'Password is incorrect') {
          return res.status(400).json({ error: error.message });
        }
        if (error.message === 'Email is already in use') {
          return res.status(400).json({ error: error.message });
        }
      }
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

// Upload avatar
router.post('/avatar', upload.single('avatar'), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Construct the avatar URL (relative path)
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Update user's avatar in database
    const user = await userService.updateProfile(req.user.userId, { avatarUrl });

    res.json({ user, avatarUrl });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

export default router;

