import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const guestService = {
  async addGuest(sessionId: string, courtId: string | null, name: string, status: string, addedById: string) {
    // Validate status
    if (!['yes', 'no', 'maybe'].includes(status)) {
      throw new Error('Invalid status. Must be yes, no, or maybe');
    }

    // If status is 'yes' and courtId is provided, check if court exists and has space
    if (status === 'yes' && courtId) {
      const court = await prisma.court.findUnique({
        where: { id: courtId },
        include: {
          rsvps: {
            where: { status: 'yes' },
          },
          guests: {
            where: { status: 'yes' },
          },
        },
      });

      if (!court) {
        throw new Error('Court not found');
      }

      const totalPlayers = court.rsvps.length + court.guests.length;
      if (totalPlayers >= court.maxPlayers) {
        throw new Error('Court is full');
      }
    }

    const guest = await prisma.guest.create({
      data: {
        sessionId,
        courtId: status === 'yes' ? courtId : null,
        name: name.trim(),
        status,
        addedById,
      },
      include: {
        addedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return guest;
  },

  async removeGuest(guestId: string, userId: string) {
    const guest = await prisma.guest.findUnique({
      where: { id: guestId },
      include: {
        session: true,
      },
    });

    if (!guest) {
      throw new Error('Guest not found');
    }

    // Only the person who added the guest or the session creator can remove them
    if (guest.addedById !== userId && guest.session.createdById !== userId) {
      throw new Error('Only the person who added the guest or the session creator can remove them');
    }

    await prisma.guest.delete({
      where: { id: guestId },
    });

    return { message: 'Guest removed successfully' };
  },

  async updateGuestStatus(guestId: string, status: string, courtId: string | null, userId: string) {
    // Validate status
    if (!['yes', 'no', 'maybe'].includes(status)) {
      throw new Error('Invalid status. Must be yes, no, or maybe');
    }

    const guest = await prisma.guest.findUnique({
      where: { id: guestId },
      include: {
        session: true,
      },
    });

    if (!guest) {
      throw new Error('Guest not found');
    }

    // Only the person who added the guest or the session creator can update them
    if (guest.addedById !== userId && guest.session.createdById !== userId) {
      throw new Error('Only the person who added the guest or the session creator can update them');
    }

    // If status is 'yes' and courtId is provided, check if court has space
    if (status === 'yes' && courtId) {
      const court = await prisma.court.findUnique({
        where: { id: courtId },
        include: {
          rsvps: {
            where: { status: 'yes' },
          },
          guests: {
            where: { 
              status: 'yes',
              id: { not: guestId }, // Exclude current guest from count
            },
          },
        },
      });

      if (!court) {
        throw new Error('Court not found');
      }

      const totalPlayers = court.rsvps.length + court.guests.length;
      if (totalPlayers >= court.maxPlayers) {
        throw new Error('Court is full');
      }
    }

    const updatedGuest = await prisma.guest.update({
      where: { id: guestId },
      data: {
        status,
        courtId: status === 'yes' ? courtId : null,
      },
      include: {
        addedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return updatedGuest;
  },

  async getGuestsForCourt(courtId: string) {
    const guests = await prisma.guest.findMany({
      where: { courtId },
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
    });

    return guests;
  },

  async getGuestsForSession(sessionId: string) {
    const guests = await prisma.guest.findMany({
      where: { sessionId },
      include: {
        addedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        court: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return guests;
  },
};

