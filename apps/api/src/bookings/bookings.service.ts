import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { Prisma } from '@smartcanteen/database';
import { PrismaService } from '../database/prisma.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { paginated } from '../common/utils/paginate';
import { CreateBookingDto } from './dto/booking.dto';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  private generateRef(): string {
    return `BK-${randomBytes(4).toString('hex').toUpperCase()}`;
  }

  /** Resolve the employee acting for a booking (self-service or admin-on-behalf). */
  private async resolveEmployee(companyId: string, userId: string, employeeId?: string) {
    if (employeeId) {
      const emp = await this.prisma.employee.findFirst({
        where: { id: employeeId, companyId, deletedAt: null },
      });
      if (!emp) throw new NotFoundException('Employee not found');
      return emp;
    }
    const emp = await this.prisma.employee.findFirst({
      where: { userId, companyId, deletedAt: null },
    });
    if (!emp) throw new ForbiddenException('No employee profile linked to this account');
    return emp;
  }

  async create(companyId: string, userId: string, dto: CreateBookingDto) {
    const employee = await this.resolveEmployee(companyId, userId, dto.employeeId);
    const quantity = dto.quantity ?? 1;

    return this.prisma.$transaction(async (tx) => {
      const schedule = await tx.mealSchedule.findFirst({
        where: { id: dto.scheduleId, companyId, deletedAt: null },
        include: { meal: true },
      });
      if (!schedule) throw new NotFoundException('Meal schedule not found');
      if (schedule.status !== 'OPEN') {
        throw new BadRequestException('Bookings are closed for this meal');
      }
      if (schedule.bookingCutoff && schedule.bookingCutoff < new Date()) {
        throw new BadRequestException('Booking cutoff has passed');
      }

      if (schedule.capacity != null) {
        const booked = await tx.booking.aggregate({
          where: { scheduleId: schedule.id, status: { in: ['PENDING', 'CONFIRMED', 'COLLECTED'] } },
          _sum: { quantity: true },
        });
        const used = booked._sum.quantity ?? 0;
        if (used + quantity > schedule.capacity) {
          throw new BadRequestException('Meal capacity exceeded');
        }
      }

      const subsidy = Prisma.Decimal.min(employee.mealSubsidy, schedule.meal.retailPrice);
      const unitPrice = schedule.meal.retailPrice;
      const totalPrice = unitPrice.minus(subsidy).times(quantity);

      return tx.booking.create({
        data: {
          companyId,
          employeeId: employee.id,
          scheduleId: schedule.id,
          bookingRef: this.generateRef(),
          status: 'CONFIRMED',
          quantity,
          unitPrice,
          subsidyApplied: subsidy.times(quantity),
          totalPrice,
        },
        include: { schedule: { include: { meal: true } } },
      });
    });
  }

  async findMine(companyId: string, userId: string, query: PaginationQueryDto) {
    const employee = await this.prisma.employee.findFirst({
      where: { userId, companyId, deletedAt: null },
      select: { id: true },
    });
    if (!employee) return paginated([], 0, query.page, query.pageSize);
    return this.list(companyId, query, { employeeId: employee.id });
  }

  async list(companyId: string, query: PaginationQueryDto, extra: Prisma.BookingWhereInput = {}) {
    const where: Prisma.BookingWhereInput = { companyId, ...extra };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where,
        include: {
          employee: { select: { employeeNumber: true, firstName: true, lastName: true } },
          schedule: { include: { meal: { select: { name: true } } } },
        },
        skip: query.skip,
        take: query.take,
        orderBy: { createdAt: query.sortOrder },
      }),
      this.prisma.booking.count({ where }),
    ]);
    return paginated(data, total, query.page, query.pageSize);
  }

  async cancel(companyId: string, id: string) {
    const booking = await this.prisma.booking.findFirst({ where: { id, companyId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status === 'COLLECTED') {
      throw new BadRequestException('Collected bookings cannot be cancelled');
    }
    return this.prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
  }
}
