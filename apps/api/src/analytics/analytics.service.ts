import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private today() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }

  /** Executive dashboard summary cards. */
  async executiveDashboard(companyId: string) {
    const { start, end } = this.today();

    const [
      mealsToday,
      collectedToday,
      posRevenue,
      inventoryValue,
      upcomingBookings,
      employeeCount,
    ] = await Promise.all([
      this.prisma.booking.aggregate({
        where: { companyId, schedule: { serviceDate: { gte: start, lt: end } } },
        _sum: { quantity: true },
      }),
      this.prisma.booking.count({
        where: { companyId, status: 'COLLECTED', collectedAt: { gte: start, lt: end } },
      }),
      this.prisma.posTransaction.aggregate({
        where: { companyId, status: 'COMPLETED', createdAt: { gte: start, lt: end } },
        _sum: { total: true },
      }),
      this.prisma.$queryRaw<{ total: string }[]>`
        SELECT COALESCE(SUM("quantityOnHand" * "unitCost"), 0) AS total
        FROM inventory_products WHERE "companyId" = ${companyId} AND "deletedAt" IS NULL`,
      this.prisma.booking.count({
        where: { companyId, status: 'CONFIRMED', schedule: { serviceDate: { gte: end } } },
      }),
      this.prisma.employee.count({ where: { companyId, deletedAt: null, status: 'ACTIVE' } }),
    ]);

    return {
      mealsToday: mealsToday._sum.quantity ?? 0,
      collectedToday,
      revenueToday: Number(posRevenue._sum.total ?? 0),
      inventoryValue: Number(inventoryValue[0]?.total ?? 0),
      upcomingBookings,
      activeEmployees: employeeCount,
    };
  }

  /** Most-booked meals over the last N days. */
  async popularMeals(companyId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const rows = await this.prisma.$queryRaw<
      { name: string; bookings: bigint }[]
    >`
      SELECT m.name, COUNT(b.id) AS bookings
      FROM bookings b
      JOIN meal_schedules s ON s.id = b."scheduleId"
      JOIN meals m ON m.id = s."mealId"
      WHERE b."companyId" = ${companyId} AND b."createdAt" >= ${since}
      GROUP BY m.name
      ORDER BY bookings DESC
      LIMIT 10`;
    return rows.map((r) => ({ name: r.name, bookings: Number(r.bookings) }));
  }

  /** Daily revenue trend for the last N days (Recharts-ready). */
  async revenueTrend(companyId: string, days = 14) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const rows = await this.prisma.$queryRaw<
      { day: Date; total: string }[]
    >`
      SELECT DATE_TRUNC('day', "createdAt") AS day, COALESCE(SUM(total), 0) AS total
      FROM pos_transactions
      WHERE "companyId" = ${companyId} AND status = 'COMPLETED' AND "createdAt" >= ${since}
      GROUP BY day ORDER BY day ASC`;
    return rows.map((r) => ({ date: r.day, revenue: Number(r.total) }));
  }

  /** Department usage: bookings per department. */
  departmentUsage(companyId: string) {
    return this.prisma.$queryRaw`
      SELECT d.name AS department, COUNT(b.id) AS bookings
      FROM bookings b
      JOIN employees e ON e.id = b."employeeId"
      LEFT JOIN departments d ON d.id = e."departmentId"
      WHERE b."companyId" = ${companyId}
      GROUP BY d.name ORDER BY bookings DESC`;
  }
}
