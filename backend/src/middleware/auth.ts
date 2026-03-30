import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        groupId: string | null;
        isSuperAdmin: boolean;
        // Resolved from UserGroup for the active group:
        isAdmin: boolean;
        canCreateSessions: boolean;
      };
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = authService.verifyToken(token);

    // Resolve group-specific permissions for the active group
    let isAdmin = false;
    let canCreateSessions = false;

    if (decoded.groupId && !decoded.isSuperAdmin) {
      const membership = await prisma.userGroup.findUnique({
        where: { userId_groupId: { userId: decoded.userId, groupId: decoded.groupId } },
        select: { role: true, canCreateSessions: true },
      });
      if (membership) {
        isAdmin = membership.role === 'admin';
        canCreateSessions = membership.canCreateSessions;
      }
    } else if (decoded.isSuperAdmin) {
      isAdmin = true;
      canCreateSessions = true;
    }

    req.user = { ...decoded, isAdmin, canCreateSessions };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};
