import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const guestService = {
  async addGuest(courtId: string, name: string, addedById: string) {
    // Check if court exists and has space
    const court = await prisma.court.findUnique({
      where: { id: courtId },
      include: {
        rsvps: {
          where: { status: 'yes' },
        },
        guests: true,
      },
    });

    if (!court) {
      throw new Error('Court not found');
    }

    const totalPlayers = court.rsvps.length + court.guests.length;
    if (totalPlayers >= court.maxPlayers) {
      throw new Error('Court is full');
    }

    const guest = await prisma.guest.create({
      data: {
        courtId,
        name: name.trim(),
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
        court: {
          include: {
            session: true,
          },
        },
      },
    });

    if (!guest) {
      throw new Error('Guest not found');
    }

    // Only the person who added the guest or the session creator can remove them
    if (guest.addedById !== userId && guest.court.session.createdById !== userId) {
      throw new Error('Only the person who added the guest or the session creator can remove them');
    }

    await prisma.guest.delete({
      where: { id: guestId },
    });

    return { message: 'Guest removed successfully' };
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
};

