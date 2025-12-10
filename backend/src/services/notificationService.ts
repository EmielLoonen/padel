import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type NotificationType = 'session_created' | 'rsvp_update' | 'session_reminder' | 'session_updated' | 'booking_update';

interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  sessionId?: string;
}

export const notificationService = {
  async createNotification(data: CreateNotificationData) {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        sessionId: data.sessionId,
        read: false,
      },
    });
    return notification;
  },

  async getUserNotifications(userId: string, unreadOnly = false) {
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly && { read: false }),
      },
      include: {
        session: {
          select: {
            id: true,
            venueName: true,
            date: true,
            time: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to 50 most recent
    });

    return notifications;
  },

  async markAsRead(notificationId: string, userId: string) {
    // Verify notification belongs to user
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  },

  async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    });
  },

  async getUnreadCount(userId: string) {
    const count = await prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
    return count;
  },

  async deleteNotification(notificationId: string, userId: string) {
    // Verify notification belongs to user
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });
  },

  // Helper functions to create specific notification types
  async notifySessionCreated(sessionId: string, creatorId: string, sessionDetails: any) {
    // Get all users except the creator to notify them
    const users = await prisma.user.findMany({
      where: {
        id: { not: creatorId },
      },
      select: { id: true },
    });

    const notifications = users.map((user) =>
      this.createNotification({
        userId: user.id,
        type: 'session_created',
        title: '🎾 New Padel Session!',
        message: `${sessionDetails.creatorName} created a session at ${sessionDetails.venueName} on ${sessionDetails.date}`,
        sessionId,
      })
    );

    await Promise.all(notifications);
  },

  async notifyRSVPUpdate(sessionId: string, rsvpUserName: string, status: string, creatorId: string) {
    // Notify session creator about RSVP
    const statusEmoji = status === 'yes' ? '✅' : status === 'maybe' ? '🤔' : '❌';
    const statusText = status === 'yes' ? 'is coming' : status === 'maybe' ? 'might come' : "can't make it";

    await this.createNotification({
      userId: creatorId,
      type: 'rsvp_update',
      title: `${statusEmoji} RSVP Update`,
      message: `${rsvpUserName} ${statusText}`,
      sessionId,
    });
  },

  async notifySessionReminder(sessionId: string, sessionDetails: any) {
    // Get all users who RSVPed "yes" or "maybe"
    const rsvps = await prisma.rSVP.findMany({
      where: {
        sessionId,
        status: { in: ['yes', 'maybe'] },
      },
      select: { userId: true },
    });

    const notifications = rsvps.map((rsvp) =>
      this.createNotification({
        userId: rsvp.userId,
        type: 'session_reminder',
        title: '⏰ Session Tomorrow!',
        message: `Don't forget: Padel at ${sessionDetails.venueName} tomorrow at ${sessionDetails.time}`,
        sessionId,
      })
    );

    await Promise.all(notifications);
  },

  async notifySessionUpdated(sessionId: string, updatedBy: string, changes: string) {
    // Get all users who RSVPed
    const rsvps = await prisma.rSVP.findMany({
      where: { sessionId },
      select: { userId: true },
    });

    const notifications = rsvps.map((rsvp) =>
      this.createNotification({
        userId: rsvp.userId,
        type: 'session_updated',
        title: '📝 Session Updated',
        message: `${updatedBy} updated the session: ${changes}`,
        sessionId,
      })
    );

    await Promise.all(notifications);
  },

  async notifyCourtAssignment(sessionId: string, courtId: string, userId: string, creatorId: string) {
    // Get session and court details
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        courts: {
          where: { id: courtId },
        },
      },
    });

    if (!session || !session.courts[0]) {
      return;
    }

    const court = session.courts[0];
    const courtNumber = court.courtNumber;

    // Notify the user who got assigned to the court
    await this.createNotification({
      userId,
      type: 'rsvp_update',
      title: '🎾 Court Spot Available!',
      message: `A spot opened up on Court ${courtNumber}! You've been automatically assigned.`,
      sessionId,
    });

    // Optionally notify the session creator
    if (userId !== creatorId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      if (user) {
        await this.createNotification({
          userId: creatorId,
          type: 'rsvp_update',
          title: '🔄 Waitlist Assignment',
          message: `${user.name} was automatically assigned to Court ${courtNumber} from the waitlist.`,
          sessionId,
        });
      }
    }
  },
};

