import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface UpdateCourtData {
  courtNumber?: number;
  startTime?: string;
  duration?: number;
  cost?: number;
  maxPlayers?: number;
}

export const courtService = {
  async updateCourt(courtId: string, userId: string, data: UpdateCourtData) {
    // Get the court with session info
    const court = await prisma.court.findUnique({
      where: { id: courtId },
      include: {
        session: true,
      },
    });

    if (!court) {
      throw new Error('Court not found');
    }

    // Check admin status via UserGroup for the session's group
    let isAdmin = false;
    if (court.session.groupId) {
      const membership = await prisma.userGroup.findUnique({
        where: { userId_groupId: { userId, groupId: court.session.groupId } },
        select: { role: true },
      });
      isAdmin = membership?.role === 'admin';
    }

    // Check if user is the session creator or admin
    if (court.session.createdById !== userId && !isAdmin) {
      throw new Error('Only the session creator can update courts');
    }

    // If maxPlayers is being reduced, evict players over the new limit
    if (data.maxPlayers !== undefined && data.maxPlayers < court.maxPlayers) {
      const [rsvps, guests] = await Promise.all([
        prisma.rSVP.findMany({
          where: { courtId },
          orderBy: { createdAt: 'asc' },
          select: { id: true, createdAt: true },
        }),
        prisma.guest.findMany({
          where: { courtId },
          orderBy: { createdAt: 'asc' },
          select: { id: true, createdAt: true },
        }),
      ]);

      // Merge and sort by join time, keep first maxPlayers, move the rest to waitlist
      const allPlayers = [
        ...rsvps.map((r) => ({ id: r.id, type: 'rsvp' as const, createdAt: r.createdAt })),
        ...guests.map((g) => ({ id: g.id, type: 'guest' as const, createdAt: g.createdAt })),
      ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      const toEvict = allPlayers.slice(data.maxPlayers);

      const evictedRsvpIds = toEvict.filter((p) => p.type === 'rsvp').map((p) => p.id);
      const evictedGuestIds = toEvict.filter((p) => p.type === 'guest').map((p) => p.id);

      await prisma.$transaction([
        ...(evictedRsvpIds.length > 0
          ? [prisma.rSVP.updateMany({ where: { id: { in: evictedRsvpIds } }, data: { courtId: null } })]
          : []),
        ...(evictedGuestIds.length > 0
          ? [prisma.guest.updateMany({ where: { id: { in: evictedGuestIds } }, data: { courtId: null } })]
          : []),
      ]);
    }

    // Update the court
    const updatedCourt = await prisma.court.update({
      where: { id: courtId },
      data: {
        ...(data.courtNumber !== undefined && { courtNumber: data.courtNumber }),
        ...(data.startTime !== undefined && { startTime: data.startTime }),
        ...(data.duration !== undefined && { duration: data.duration }),
        ...(data.cost !== undefined && { cost: data.cost }),
        ...(data.maxPlayers !== undefined && { maxPlayers: data.maxPlayers }),
      },
    });

    return updatedCourt;
  },

  async deleteCourt(courtId: string, userId: string) {
    // Get the court with session info
    const court = await prisma.court.findUnique({
      where: { id: courtId },
      include: {
        session: true,
        rsvps: true,
      },
    });

    if (!court) {
      throw new Error('Court not found');
    }

    // Check admin status via UserGroup for the session's group
    let isAdmin = false;
    if (court.session.groupId) {
      const membership = await prisma.userGroup.findUnique({
        where: { userId_groupId: { userId, groupId: court.session.groupId } },
        select: { role: true },
      });
      isAdmin = membership?.role === 'admin';
    }

    // Check if user is the session creator or admin
    if (court.session.createdById !== userId && !isAdmin) {
      throw new Error('Only the session creator can delete courts');
    }

    // Check if court has any RSVPs
    if (court.rsvps.length > 0) {
      throw new Error('Cannot delete a court with players assigned');
    }

    // Delete the court
    await prisma.court.delete({
      where: { id: courtId },
    });

    // Update session numberOfCourts
    await prisma.session.update({
      where: { id: court.sessionId },
      data: {
        numberOfCourts: {
          decrement: 1,
        },
      },
    });

    return { message: 'Court deleted successfully' };
  },
};

