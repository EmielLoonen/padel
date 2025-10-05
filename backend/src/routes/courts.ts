import express, { Request, Response } from 'express';
import { courtService } from '../services/courtService';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All court routes require authentication
router.use(authenticateToken);

// Delete a court
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await courtService.deleteCourt(req.params.id, req.user.userId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Court not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Only the session creator')) {
        return res.status(403).json({ error: error.message });
      }
      if (error.message.includes('Cannot delete')) {
        return res.status(400).json({ error: error.message });
      }
    }
    console.error('Delete court error:', error);
    res.status(500).json({ error: 'Failed to delete court' });
  }
});

export default router;

