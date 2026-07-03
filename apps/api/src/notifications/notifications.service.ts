import { Injectable } from '@nestjs/common';
import {
  NotificationChannel,
  NotificationType,
  Prisma,
} from '@smartcanteen/database';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  listForUser(companyId: string, userId: string) {
    return this.prisma.notification.findMany({
      where: { companyId, OR: [{ userId }, { userId: null }] },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  unreadCount(companyId: string, userId: string) {
    return this.prisma.notification.count({
      where: { companyId, OR: [{ userId }, { userId: null }], readAt: null },
    });
  }

  markRead(userId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, OR: [{ userId }, { userId: null }] },
      data: { readAt: new Date(), status: 'READ' },
    });
  }

  markAllRead(companyId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { companyId, userId, readAt: null },
      data: { readAt: new Date(), status: 'READ' },
    });
  }

  /**
   * Persist a notification. In production a BullMQ worker picks QUEUED rows and
   * dispatches over push/email/SMS; here we store the record and mark IN_APP as
   * delivered immediately.
   */
  create(
    companyId: string,
    payload: {
      userId?: string;
      type: NotificationType;
      channel?: NotificationChannel;
      title: string;
      body: string;
      data?: Prisma.InputJsonValue;
    },
  ) {
    const channel = payload.channel ?? 'IN_APP';
    return this.prisma.notification.create({
      data: {
        companyId,
        userId: payload.userId,
        type: payload.type,
        channel,
        title: payload.title,
        body: payload.body,
        data: payload.data,
        status: channel === 'IN_APP' ? 'DELIVERED' : 'QUEUED',
        sentAt: channel === 'IN_APP' ? new Date() : null,
      },
    });
  }
}
