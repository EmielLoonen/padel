import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

const requireSuperAdmin = (req: any, res: Response, next: any) => {
  if (!req.user?.isSuperAdmin) {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
};

router.use(requireSuperAdmin);

// GET /api/superadmin/stats — app-wide counts
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [totalGroups, totalUsers, totalSessions, totalCourts] = await Promise.all([
      prisma.group.count(),
      prisma.user.count(),
      prisma.session.count(),
      prisma.court.count(),
    ]);

    res.json({ totalGroups, totalUsers, totalSessions, totalCourts });
  } catch (error) {
    console.error('Superadmin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/superadmin/groups — all groups with member + session counts
router.get('/groups', async (_req: Request, res: Response) => {
  try {
    const groups = await prisma.group.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { members: true, sessions: true },
        },
      },
    });

    res.json({ groups });
  } catch (error) {
    console.error('Superadmin groups error:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// GET /api/superadmin/users — all users with their group memberships
router.get('/users', async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        isSuperAdmin: true,
        lastLogin: true,
        createdAt: true,
        groups: {
          select: {
            role: true,
            canCreateSessions: true,
            group: { select: { id: true, name: true, sportType: true } },
          },
        },
      },
    });

    res.json({ users });
  } catch (error) {
    console.error('Superadmin users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PATCH /api/superadmin/users/:userId/groups/:groupId/can-create-sessions
router.patch('/users/:userId/groups/:groupId/can-create-sessions', async (req: Request, res: Response) => {
  const { userId, groupId } = req.params;
  const { canCreateSessions } = req.body;

  if (typeof canCreateSessions !== 'boolean') {
    return res.status(400).json({ error: 'canCreateSessions must be a boolean' });
  }

  try {
    const membership = await prisma.userGroup.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });

    if (!membership) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    await prisma.userGroup.update({
      where: { userId_groupId: { userId, groupId } },
      data: { canCreateSessions },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Superadmin canCreateSessions error:', error);
    res.status(500).json({ error: 'Failed to update permission' });
  }
});

// POST /api/superadmin/users/:userId/reset-password
router.post('/users/:userId/reset-password', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({ error: 'newPassword must be at least 6 characters' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: hashed } });

    res.json({ success: true });
  } catch (error) {
    console.error('Superadmin reset-password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;
