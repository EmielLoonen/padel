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
}

interface LoginData {
  email: string;
  password: string;
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

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user (defaults to Limited Seat Player)
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        phone: data.phone,
        canCreateSessions: false, // New users are Limited Seat Players by default
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatarUrl: true,
        isAdmin: true,
        canCreateSessions: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    // Notify admins about new user signup (defaults to Limited Seat Player)
    try {
      await notificationService.notifyNewUserSignup(user.id, user.name, user.email);
    } catch (error) {
      // Don't fail signup if notification fails
      console.error('Failed to send new user notification:', error);
    }

    return { user, token };
  },

  async login(data: LoginData) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);

    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Store previous lastLogin before updating (for missed notifications check)
    const previousLastLogin = user.lastLogin;
    const newLastLogin = new Date();

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: newLastLogin },
    });

    // Generate JWT token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        isAdmin: user.isAdmin,
        canCreateSessions: user.canCreateSessions,
      },
      token,
      previousLastLogin: previousLastLogin ? previousLastLogin.toISOString() : null, // Include previous login time for frontend
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
        isAdmin: true,
        canCreateSessions: true,
        createdAt: true,
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
      };
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  },
};

