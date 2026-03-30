import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// Generate a short human-readable invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// GET /api/groups/me — get all groups the current user is a member of
router.get('/me', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const memberships = await prisma.userGroup.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            _count: { select: { members: true } },
          },
        },
      },
    });

    const groups = memberships.map((m) => ({
      ...m.group,
      role: m.role,
      canCreateSessions: m.canCreateSessions,
    }));

    res.json({ groups });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// POST /api/groups — create a new group (user becomes its admin)
router.post(
  '/',
  [body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Group name is required')],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user!.userId;

      // Generate a unique invite code
      let inviteCode = generateInviteCode();
      while (await prisma.group.findUnique({ where: { inviteCode } })) {
        inviteCode = generateInviteCode();
      }

      // Create the group and add the creator as admin via UserGroup
      const group = await prisma.group.create({
        data: {
          name: req.body.name,
          inviteCode,
          members: {
            create: {
              userId,
              role: 'admin',
              canCreateSessions: true,
            },
          },
        },
      });

      res.status(201).json({ group });
    } catch (error) {
      console.error('Create group error:', error);
      res.status(500).json({ error: 'Failed to create group' });
    }
  }
);

// POST /api/groups/join — join a group via invite code
router.post(
  '/join',
  [body('inviteCode').trim().isLength({ min: 1 }).withMessage('Invite code is required')],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user!.userId;

      // Find the group by invite code
      const group = await prisma.group.findUnique({
        where: { inviteCode: req.body.inviteCode.trim().toUpperCase() },
      });

      if (!group) {
        return res.status(404).json({ error: 'Invalid invite code' });
      }

      // Check if already a member
      const existing = await prisma.userGroup.findUnique({
        where: { userId_groupId: { userId, groupId: group.id } },
      });

      if (existing) {
        return res.status(400).json({ error: 'You are already in this group' });
      }

      // Add user as a member
      await prisma.userGroup.create({
        data: {
          userId,
          groupId: group.id,
          role: 'member',
          canCreateSessions: false,
        },
      });

      res.json({ group: { id: group.id, name: group.name } });
    } catch (error) {
      console.error('Join group error:', error);
      res.status(500).json({ error: 'Failed to join group' });
    }
  }
);

// DELETE /api/groups/:groupId — delete a group (admin only)
router.delete('/:groupId', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { groupId } = req.params;

    // Must be admin of that group (or superAdmin)
    if (!req.user!.isSuperAdmin) {
      const membership = await prisma.userGroup.findUnique({
        where: { userId_groupId: { userId, groupId } },
        select: { role: true },
      });
      if (!membership) {
        return res.status(403).json({ error: 'You are not a member of this group' });
      }
      if (membership.role !== 'admin') {
        return res.status(403).json({ error: 'Only group admins can delete a group' });
      }
    }

    // Detach sessions (set groupId to null) so they are not lost
    await prisma.session.updateMany({
      where: { groupId },
      data: { groupId: null },
    });

    // Delete the group — cascades to UserGroup rows
    await prisma.group.delete({ where: { id: groupId } });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

// PATCH /api/groups/invite-code — regenerate invite code (admin only)
router.patch('/invite-code', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const groupId = req.user!.groupId;

    if (!groupId) {
      return res.status(400).json({ error: 'You are not in a group' });
    }

    // Check membership and admin role via UserGroup
    const membership = await prisma.userGroup.findUnique({
      where: { userId_groupId: { userId, groupId } },
      select: { role: true },
    });

    if (!membership) {
      return res.status(400).json({ error: 'You are not in this group' });
    }

    if (membership.role !== 'admin' && !req.user!.isSuperAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    let inviteCode = generateInviteCode();
    while (await prisma.group.findUnique({ where: { inviteCode } })) {
      inviteCode = generateInviteCode();
    }

    const group = await prisma.group.update({
      where: { id: groupId },
      data: { inviteCode },
    });

    res.json({ inviteCode: group.inviteCode });
  } catch (error) {
    console.error('Regenerate invite code error:', error);
    res.status(500).json({ error: 'Failed to regenerate invite code' });
  }
});

// PATCH /api/groups/name — rename the group (admin only)
router.patch(
  '/name',
  [body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Group name is required')],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user!.userId;
      const groupId = req.user!.groupId;

      if (!groupId) {
        return res.status(400).json({ error: 'You are not in a group' });
      }

      // Check membership and admin role via UserGroup
      const membership = await prisma.userGroup.findUnique({
        where: { userId_groupId: { userId, groupId } },
        select: { role: true },
      });

      if (!membership) {
        return res.status(400).json({ error: 'You are not in this group' });
      }

      if (membership.role !== 'admin' && !req.user!.isSuperAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const group = await prisma.group.update({
        where: { id: groupId },
        data: { name: req.body.name },
      });

      res.json({ name: group.name });
    } catch (error) {
      console.error('Rename group error:', error);
      res.status(500).json({ error: 'Failed to rename group' });
    }
  }
);

// PATCH /api/groups/avatar — upload group avatar (admin only)
router.patch('/avatar', upload.single('avatar'), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const groupId = req.user!.groupId;

    if (!groupId) {
      return res.status(400).json({ error: 'You are not in a group' });
    }

    const membership = await prisma.userGroup.findUnique({
      where: { userId_groupId: { userId, groupId } },
      select: { role: true },
    });

    if (!membership) {
      return res.status(403).json({ error: 'You are not in this group' });
    }

    if (membership.role !== 'admin' && !req.user!.isSuperAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const avatarUrl = (req.file as any).path; // Cloudinary returns the full URL in file.path

    const group = await prisma.group.update({
      where: { id: groupId },
      data: { avatarUrl },
    });

    res.json({ avatarUrl: group.avatarUrl });
  } catch (error) {
    console.error('Group avatar upload error:', error);
    res.status(500).json({ error: 'Failed to upload group avatar' });
  }
});

export default router;
