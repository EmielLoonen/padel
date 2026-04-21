import { PrismaClient } from '@prisma/client';
import { notificationService } from './notificationService';

const prisma = new PrismaClient();

// Unambiguous uppercase chars for human-typeable watch codes
const WATCH_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

async function generateUniqueWatchCode(): Promise<string> {
  while (true) {
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += WATCH_CODE_CHARS[Math.floor(Math.random() * WATCH_CODE_CHARS.length)];
    }
    const existing = await prisma.court.findUnique({ where: { watchCode: code } });
    if (!existing) return code;
  }
}

interface CourtData {
  courtNumber: number;
  startTime: string;
  duration?: number; // default 60 minutes
  cost?: number;
  maxPlayers?: number;
}

interface CreateSessionData {
  date: Date;
  time: string;
  venueName: string;
  venueAddress?: string;
  totalCost?: number;
  notes?: string;
  courts: CourtData[];
  createdById: string;
  groupId: string | null;
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
    // Look up the group's sport type to use as the session sport type
    const group = data.groupId
      ? await prisma.group.findUnique({ where: { id: data.groupId }, select: { sportType: true } })
      : null;
    const sportType = group?.sportType ?? 'PADEL';

    const session = await prisma.session.create({
      data: {
        date: data.date,
        time: data.time,
        venueName: data.venueName,
        venueAddress: data.venueAddress,
        totalCost: data.totalCost,
        notes: data.notes,
        sportType,
        numberOfCourts: data.courts.length,
        createdById: data.createdById,
        groupId: data.groupId,
        courts: {
          create: await Promise.all(
            data.courts.map(async (court) => ({
              courtNumber: court.courtNumber,
              startTime: court.startTime,
              duration: court.duration || 60,
              maxPlayers: court.maxPlayers ?? (sportType === 'TENNIS' ? 2 : 4),
              cost: court.cost,
              watchCode: await generateUniqueWatchCode(),
            }))
          ),
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

  async getAllSessions(filters?: { type?: 'upcoming' | 'past' | 'all'; groupId?: string | null }) {
    // Get start of today (midnight) for date comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get start of tomorrow (midnight)
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // undefined = superAdmin (no filter), null = no active group (show nothing), string = filter by group
    const groupFilter = filters?.groupId !== undefined ? { groupId: filters.groupId } : {};

    let whereClause: object = { ...groupFilter };

    if (filters?.type === 'upcoming') {
      whereClause = { ...groupFilter, date: { gte: today } };
    } else if (filters?.type === 'past') {
      whereClause = { ...groupFilter, date: { lt: today } };
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

    // Check admin status via UserGroup for the session's group
    let isAdmin = false;
    if (session.groupId) {
      const membership = await prisma.userGroup.findUnique({
        where: { userId_groupId: { userId, groupId: session.groupId } },
        select: { role: true },
      });
      isAdmin = membership?.role === 'admin';
    }

    if (session.createdById !== userId && !isAdmin) {
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

    // Check admin status via UserGroup for the session's group
    let isAdmin = false;
    if (session.groupId) {
      const membership = await prisma.userGroup.findUnique({
        where: { userId_groupId: { userId, groupId: session.groupId } },
        select: { role: true },
      });
      isAdmin = membership?.role === 'admin';
    }

    if (session.createdById !== userId && !isAdmin) {
      throw new Error('Only the session creator can delete this session');
    }

    await prisma.session.delete({
      where: { id: sessionId },
    });

    return { message: 'Session deleted successfully' };
  },
};
