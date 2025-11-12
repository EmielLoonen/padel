import { PrismaClient } from '@prisma/client';
import { notificationService } from './notificationService';

const prisma = new PrismaClient();

interface CourtData {
  courtNumber: number;
  startTime: string;
  duration?: number; // default 60 minutes
  cost?: number;
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
            cost: court.cost,
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
    // Get start of today (midnight) for date comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get start of tomorrow (midnight)
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let whereClause = {};

    if (filters?.type === 'upcoming') {
      // Sessions from today onwards (includes today)
      whereClause = { date: { gte: today } };
    } else if (filters?.type === 'past') {
      // Sessions before today
      whereClause = { date: { lt: today } };
    }

    // For past sessions, sort descending (newest first). For upcoming/all, sort ascending (oldest first)
    const sortOrder = filters?.type === 'past' ? 'desc' : 'asc';

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
      orderBy: [{ date: sortOrder }, { time: sortOrder }],
    });

    // Add RSVP summary for each session
    return sessions.map((session) => {
      // Include both registered user RSVPs and guest players in the summary
      const rsvpSummary = {
        yes: session.rsvps.filter((r) => r.status === 'yes').length + session.guests.filter((g) => g.status === 'yes').length,
        no: session.rsvps.filter((r) => r.status === 'no').length + session.guests.filter((g) => g.status === 'no').length,
        maybe: session.rsvps.filter((r) => r.status === 'maybe').length + session.guests.filter((g) => g.status === 'maybe').length,
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
    // Check if user is the creator or admin
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        creator: true,
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Fetch requesting user to check admin status
    const requestingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (session.createdById !== userId && !requestingUser?.isAdmin) {
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
    // Check if user is the creator or admin
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Fetch requesting user to check admin status
    const requestingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (session.createdById !== userId && !requestingUser?.isAdmin) {
      throw new Error('Only the session creator can delete this session');
    }

    await prisma.session.delete({
      where: { id: sessionId },
    });

    return { message: 'Session deleted successfully' };
  },
};
