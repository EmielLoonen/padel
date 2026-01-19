import { PrismaClient } from '@prisma/client';
import { notificationService } from './notificationService';

const prisma = new PrismaClient();

type RSVPStatus = 'yes' | 'no' | 'maybe';

interface OverlapInfo {
  sessionId: string;
  sessionName: string;
  date: Date;
  courtNumber: number;
  startTime: string;
  endTime: string;
}

// Helper function to parse time string (HH:MM) and add minutes
function addMinutesToTime(timeStr: string, minutes: number): string {
  const [hours, mins] = timeStr.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60);
  const newMins = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
}

// Helper function to check if two time ranges overlap
function timeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  // Convert time strings to minutes for comparison
  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const start1Min = toMinutes(start1);
  const end1Min = toMinutes(end1);
  const start2Min = toMinutes(start2);
  const end2Min = toMinutes(end2);

  // Two ranges overlap if: start1 < end2 AND end1 > start2
  return start1Min < end2Min && end1Min > start2Min;
}

// Check for time overlaps with existing RSVPs
async function checkTimeOverlaps(
  userId: string,
  sessionDate: Date,
  courtStartTime: string,
  courtDuration: number,
  excludeSessionId?: string
): Promise<OverlapInfo[]> {
  // Normalize session date to start of day for comparison
  const sessionDateStart = new Date(sessionDate);
  sessionDateStart.setHours(0, 0, 0, 0);
  
  const sessionDateEnd = new Date(sessionDateStart);
  sessionDateEnd.setDate(sessionDateEnd.getDate() + 1);

  // Get all sessions where user has RSVP'd "yes" on the same date
  const existingRSVPs = await prisma.rSVP.findMany({
    where: {
      userId,
      status: 'yes',
      courtId: { not: null }, // Only check RSVPs with assigned courts
      session: {
        date: {
          gte: sessionDateStart,
          lt: sessionDateEnd,
        },
        id: excludeSessionId ? { not: excludeSessionId } : undefined,
      },
    },
    include: {
      session: {
        include: {
          courts: true,
        },
      },
      court: true,
    },
  });

  const overlaps: OverlapInfo[] = [];
  const newEndTime = addMinutesToTime(courtStartTime, courtDuration);

  for (const rsvp of existingRSVPs) {
    if (!rsvp.court) continue;

    const existingStartTime = rsvp.court.startTime;
    const existingDuration = rsvp.court.duration;
    const existingEndTime = addMinutesToTime(existingStartTime, existingDuration);

    // Check if time ranges overlap
    if (timeRangesOverlap(courtStartTime, newEndTime, existingStartTime, existingEndTime)) {
      overlaps.push({
        sessionId: rsvp.session.id,
        sessionName: rsvp.session.venueName,
        date: rsvp.session.date,
        courtNumber: rsvp.court.courtNumber,
        startTime: existingStartTime,
        endTime: existingEndTime,
      });
    }
  }

  return overlaps;
}

export const rsvpService = {
  async createOrUpdateRSVP(
    sessionId: string,
    userId: string,
    status: RSVPStatus,
    courtId?: string | null
  ): Promise<{ rsvp: any; overlaps: OverlapInfo[] }> {
    // Check if session and court exist
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { courts: true },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Get existing RSVP to check if they had a court assigned
    const existingRSVP = await prisma.rSVP.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId,
        },
      },
    });

    const previousCourtId = existingRSVP?.courtId || null;
    const isCancelling = status === 'no' && previousCourtId !== null;

    let overlaps: OverlapInfo[] = [];

    // If status is "yes" and courtId is provided, validate it and check for overlaps
    if (status === 'yes' && courtId) {
      const court = session.courts.find((c) => c.id === courtId);
      if (!court) {
        throw new Error('Court not found');
      }

      // Check if court is full (excluding current user if they're already on this court)
      const courtRSVPs = await prisma.rSVP.count({
        where: {
          courtId: courtId,
          status: 'yes',
          userId: { not: userId }, // Exclude current user from count
        },
      });

      const courtGuests = await prisma.guest.count({
        where: { courtId: courtId },
      });

      if (courtRSVPs + courtGuests >= court.maxPlayers) {
        throw new Error('Court is full');
      }

      // Check for time overlaps with existing RSVPs
      overlaps = await checkTimeOverlaps(
        userId,
        session.date,
        court.startTime,
        court.duration,
        sessionId // Exclude current session from overlap check
      );
    }

    // Upsert RSVP (create or update)
    const rsvp = await prisma.rSVP.upsert({
      where: {
        sessionId_userId: {
          sessionId,
          userId,
        },
      },
      update: {
        status,
        courtId: status === 'yes' ? courtId : null, // Only assign court for "yes"
      },
      create: {
        sessionId,
        userId,
        status,
        courtId: status === 'yes' ? courtId : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        court: true,
      },
    });

    // If someone cancelled and freed up a court, assign first waitlist person
    if (isCancelling && previousCourtId) {
      // Find first person on waitlist (status='yes', courtId=null, ordered by createdAt)
      const waitlistRSVP = await prisma.rSVP.findFirst({
        where: {
          sessionId,
          status: 'yes',
          courtId: null,
          userId: { not: userId }, // Don't assign to the person who just cancelled
        },
        orderBy: {
          createdAt: 'asc', // First come, first served
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (waitlistRSVP) {
        // Check if the court still has space (accounting for guests)
        const courtRSVPs = await prisma.rSVP.count({
          where: {
            courtId: previousCourtId,
            status: 'yes',
          },
        });

        const courtGuests = await prisma.guest.count({
          where: { courtId: previousCourtId },
        });

        const court = await prisma.court.findUnique({
          where: { id: previousCourtId },
        });

        if (court && courtRSVPs + courtGuests < court.maxPlayers) {
          // Assign waitlist person to the freed court
          await prisma.rSVP.update({
            where: {
              sessionId_userId: {
                sessionId,
                userId: waitlistRSVP.userId,
              },
            },
            data: {
              courtId: previousCourtId,
            },
          });

          // Notify the waitlist person that they got a spot
          await notificationService.notifyCourtAssignment(
            sessionId,
            previousCourtId,
            waitlistRSVP.userId,
            session.createdById
          );
        }
      }
    }

    // Notify session creator about the RSVP (but not if they're RSVPing to their own session)
    if (userId !== session.createdById) {
      await notificationService.notifyRSVPUpdate(
        sessionId,
        rsvp.user.name,
        status,
        session.createdById
      );
    }

    return { rsvp, overlaps };
  },

  async getRSVPsForSession(sessionId: string) {
    const rsvps = await prisma.rSVP.findMany({
      where: { sessionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        court: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Get court availability
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        courts: {
          include: {
            rsvps: {
              where: { status: 'yes' },
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
      },
    });

    const courtsInfo = session?.courts.map((court) => {
      const yesGuests = court.guests.filter((g) => g.status === 'yes');
      const totalPlayers = court.rsvps.length + yesGuests.length;
      return {
        ...court,
        availableSpots: court.maxPlayers - totalPlayers,
        isFull: totalPlayers >= court.maxPlayers,
      };
    });

    // Get all guests from session (not just from courts, as maybe/no guests might not have courtId)
    const allGuests = session?.guests || [];
    
    const summary = {
      yes: rsvps.filter((r) => r.status === 'yes').length + allGuests.filter((g) => g.status === 'yes').length,
      no: rsvps.filter((r) => r.status === 'no').length + allGuests.filter((g) => g.status === 'no').length,
      maybe: rsvps.filter((r) => r.status === 'maybe').length + allGuests.filter((g) => g.status === 'maybe').length,
    };

    return { rsvps, summary, courtsInfo };
  },

  async getUserRSVPForSession(sessionId: string, userId: string) {
    const rsvp = await prisma.rSVP.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return rsvp;
  },

  async deleteRSVP(sessionId: string, userId: string) {
    // Check if RSVP exists
    const rsvp = await prisma.rSVP.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId,
        },
      },
    });

    if (!rsvp) {
      throw new Error('RSVP not found');
    }

    await prisma.rSVP.delete({
      where: {
        sessionId_userId: {
          sessionId,
          userId,
        },
      },
    });

    return { message: 'RSVP removed successfully' };
  },
};

