import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { notificationService } from './notificationService';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = '7d';

interface SignupData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  inviteCode?: string;
}

interface LoginData {
  email: string;
  password: string;
}

function signToken(userId: string, email: string, groupId: string | null, isSuperAdmin: boolean): string {
  return jwt.sign(
    { userId, email, groupId, isSuperAdmin },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export const authService = {
  async signup(data: SignupData) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Resolve invite code to a group if provided
    let group: { id: string } | null = null;
    if (data.inviteCode) {
      group = await prisma.group.findUnique({
        where: { inviteCode: data.inviteCode.trim().toUpperCase() },
      });
      if (!group) {
        throw new Error('Invalid invite code');
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        phone: data.phone,
        ...(group ? {
          groups: {
            create: {
              groupId: group.id,
              role: 'member',
              canCreateSessions: false,
            },
          },
        } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatarUrl: true,
        isSuperAdmin: true,
        createdAt: true,
        groups: {
          select: {
            groupId: true,
            role: true,
            canCreateSessions: true,
            group: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
    });

    const activeGroupId = group?.id ?? null;
    const token = signToken(user.id, user.email, activeGroupId, false);

    // Notify admins about new user signup
    if (group) {
      try {
        await notificationService.notifyNewUserSignup(user.id, user.name, user.email, group.id);
      } catch (error) {
        console.error('Failed to send new user notification:', error);
      }
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        isSuperAdmin: user.isSuperAdmin,
        isAdmin: false,
        canCreateSessions: false,
        groupId: activeGroupId,
        groups: user.groups.map((ug) => ({
          id: ug.group.id,
          name: ug.group.name,
          avatarUrl: ug.group.avatarUrl ?? null,
          role: ug.role,
          canCreateSessions: ug.canCreateSessions,
        })),
      },
      token,
    };
  },

  async login(data: LoginData) {
    // Find user with groups
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        groups: {
          include: { group: { select: { id: true, name: true, avatarUrl: true } } },
        },
      },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const previousLastLogin = user.lastLogin;
    const newLastLogin = new Date();

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: newLastLogin },
    });

    // Active group: first group the user belongs to (or null)
    const firstGroup = user.groups[0] ?? null;
    const activeGroupId = firstGroup?.groupId ?? null;

    const token = signToken(user.id, user.email, activeGroupId, user.isSuperAdmin);

    const groups = user.groups.map((ug) => ({
      id: ug.group.id,
      name: ug.group.name,
      avatarUrl: ug.group.avatarUrl ?? null,
      role: ug.role,
      canCreateSessions: ug.canCreateSessions,
    }));

    const activeUg = firstGroup;

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        isSuperAdmin: user.isSuperAdmin,
        isAdmin: activeUg?.role === 'admin',
        canCreateSessions: activeUg?.canCreateSessions ?? false,
        groupId: activeGroupId,
        groups,
      },
      token,
      previousLastLogin: previousLastLogin ? previousLastLogin.toISOString() : null,
    };
  },

  async switchGroup(userId: string, groupId: string) {
    // Validate membership
    const membership = await prisma.userGroup.findUnique({
      where: { userId_groupId: { userId, groupId } },
      include: { group: { select: { id: true, name: true } } },
    });

    if (!membership) {
      throw new Error('Not a member of this group');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, isSuperAdmin: true },
    });

    if (!user) throw new Error('User not found');

    const token = signToken(userId, user.email, groupId, user.isSuperAdmin);

    return {
      token,
      groupId,
      isAdmin: membership.role === 'admin',
      canCreateSessions: membership.canCreateSessions,
    };
  },

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatarUrl: true,
        isSuperAdmin: true,
        createdAt: true,
        groups: {
          include: { group: { select: { id: true, name: true, avatarUrl: true } } },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  },

  verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        email: string;
        groupId: string | null;
        isSuperAdmin: boolean;
      };
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  },
};
