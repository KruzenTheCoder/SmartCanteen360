import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class KitchenService {
  constructor(private readonly prisma: PrismaService) {}

  private dayRange(date: string) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }

  /** Kitchen dashboard: production plan + live collection counts for a day. */
  async dashboard(companyId: string, date: string) {
    const day = new Date(date);
    const schedules = await this.prisma.mealSchedule.findMany({
      where: { companyId, serviceDate: day, deletedAt: null },
      include: {
        meal: { select: { name: true } },
        bookings: { select: { status: true, quantity: true } },
      },
    });

    return schedules.map((s) => {
      const total = s.bookings.reduce((n, b) => n + b.quantity, 0);
      const collected = s.bookings
        .filter((b) => b.status === 'COLLECTED')
        .reduce((n, b) => n + b.quantity, 0);
      const pending = s.bookings
        .filter((b) => b.status === 'CONFIRMED')
        .reduce((n, b) => n + b.quantity, 0);
      return {
        scheduleId: s.id,
        meal: s.meal.name,
        toPrepare: total,
        collected,
        pending,
        capacity: s.capacity,
      };
    });
  }

  /** Collection queue: confirmed, not-yet-collected bookings. */
  collectionQueue(companyId: string, date: string) {
    const { start, end } = this.dayRange(date);
    return this.prisma.booking.findMany({
      where: {
        companyId,
        status: 'CONFIRMED',
        schedule: { serviceDate: { gte: start, lt: end } },
      },
      include: {
        employee: { select: { employeeNumber: true, firstName: true, lastName: true } },
        schedule: { include: { meal: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async markCollected(companyId: string, bookingId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, companyId },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== 'CONFIRMED') {
      throw new BadRequestException('Only confirmed bookings can be collected');
    }
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'COLLECTED', collectedAt: new Date() },
    });
  }

  recordWaste(
    companyId: string,
    payload: { itemLabel: string; quantity: number; unit?: string; reason: string; estimatedCost?: number },
  ) {
    return this.prisma.wasteRecord.create({
      data: {
        companyId,
        itemLabel: payload.itemLabel,
        quantity: payload.quantity,
        unit: payload.unit ?? 'unit',
        reason: payload.reason as never,
        estimatedCost: payload.estimatedCost ?? 0,
      },
    });
  }
}
