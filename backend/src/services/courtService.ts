import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface UpdateCourtData {
  courtNumber?: number;
  startTime?: string;
  duration?: number;
  cost?: number;
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

    // Check if user is the session creator
    if (court.session.createdById !== userId) {
      throw new Error('Only the session creator can update courts');
    }

    // Update the court
    const updatedCourt = await prisma.court.update({
      where: { id: courtId },
      data: {
        ...(data.courtNumber !== undefined && { courtNumber: data.courtNumber }),
        ...(data.startTime !== undefined && { startTime: data.startTime }),
        ...(data.duration !== undefined && { duration: data.duration }),
        ...(data.cost !== undefined && { cost: data.cost }),
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

