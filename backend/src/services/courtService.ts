import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const courtService = {
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

    // Check if user is the session creator
    if (court.session.createdById !== userId) {
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

