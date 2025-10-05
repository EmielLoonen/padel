import { PrismaClient } from '@prisma/client';
import { notificationService } from './notificationService';

const prisma = new PrismaClient();

interface CourtData {
  courtNumber: number;
  startTime: string;
  duration?: number; // default 60 minutes
}

interface CreateSessionData {
  date: Date;
  time: string;
  venueName: string;
  venueAddress?: string;
  totalCost?: number;
  notes?: string;
  courts: CourtData[]; // Array of courts to create
  createdById: string;
}

interface UpdateSessionData {
  date?: Date;
  time?: string;
  venueName?: string;
  venueAddress?: string;
  totalCost?: number;
  notes?: string;
}

export const sessionService = {
  async createSession(data: CreateSessionData) {
    // Create session with courts in a transaction
    const session = await prisma.session.create({
      data: {
        date: data.date,
        time: data.time,
        venueName: data.venueName,
        venueAddress: data.venueAddress,
        totalCost: data.totalCost,
        notes: data.notes,
        numberOfCourts: data.courts.length,
        createdById: data.createdById,
        courts: {
          create: data.courts.map((court) => ({
            courtNumber: court.courtNumber,
            startTime: court.startTime,
            duration: court.duration || 60,
            maxPlayers: 4,
          })),
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        courts: true,
      },
    });

    // Send notifications to all users about the new session
    await notificationService.notifySessionCreated(session.id, session.createdById, {
      creatorName: session.creator.name,
      venueName: session.venueName,
      date: session.date.toLocaleDateString(),
    });

    return session;
  },

  async getAllSessions(filters?: { type?: 'upcoming' | 'past' | 'all' }) {
    const now = new Date();
    let whereClause = {};

    if (filters?.type === 'upcoming') {
      whereClause = { date: { gte: now } };
    } else if (filters?.type === 'past') {
      whereClause = { date: { lt: now } };
    }

    const sessions = await prisma.session.findMany({
      where: whereClause,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        courts: {
          include: {
            rsvps: {
              where: { status: 'yes' }, // Only count "yes" RSVPs per court
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                  },
                },
              },
            },
            guests: {
              include: {
                addedBy: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        rsvps: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });

    // Add RSVP summary for each session
    return sessions.map((session) => {
      const rsvpSummary = {
        yes: session.rsvps.filter((r) => r.status === 'yes').length,
        no: session.rsvps.filter((r) => r.status === 'no').length,
        maybe: session.rsvps.filter((r) => r.status === 'maybe').length,
        noResponse: 0, // Would need to calculate based on total group size
      };

      return {
        ...session,
        rsvpSummary,
      };
    });
  },

  async getSessionById(sessionId: string) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        courts: {
          include: {
            rsvps: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                  },
                },
              },
            },
            guests: {
              include: {
                addedBy: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
          orderBy: {
            courtNumber: 'asc',
          },
        },
        rsvps: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    return session;
  },

  async updateSession(sessionId: string, userId: string, data: UpdateSessionData) {
    // Check if user is the creator
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        creator: true,
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.createdById !== userId) {
      throw new Error('Only the session creator can update this session');
    }

    // Build change summary for notifications
    const changes: string[] = [];
    if (data.date) changes.push('date');
    if (data.time) changes.push('time');
    if (data.venueName) changes.push('venue');
    if (data.totalCost !== undefined) changes.push('cost');

    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        ...(data.date && { date: data.date }),
        ...(data.time && { time: data.time }),
        ...(data.venueName && { venueName: data.venueName }),
        ...(data.venueAddress !== undefined && { venueAddress: data.venueAddress }),
        ...(data.totalCost !== undefined && { totalCost: data.totalCost }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Notify users about the update if there are RSVPs
    if (changes.length > 0) {
      await notificationService.notifySessionUpdated(
        sessionId,
        session.creator.name,
        changes.join(', ')
      );
    }

    return updatedSession;
  },

  async deleteSession(sessionId: string, userId: string) {
    // Check if user is the creator
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.createdById !== userId) {
      throw new Error('Only the session creator can delete this session');
    }

    await prisma.session.delete({
      where: { id: sessionId },
    });

    return { message: 'Session deleted successfully' };
  },
};
