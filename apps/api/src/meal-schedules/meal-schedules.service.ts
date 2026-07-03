import { Injectable, NotFoundException } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Prisma, ScheduleStatus } from '@smartcanteen/database';
import { PrismaService } from '../database/prisma.service';

export class CreateScheduleDto {
  @ApiProperty() @IsString() mealId!: string;
  @ApiProperty({ example: '2026-07-10' }) @IsDateString() serviceDate!: string;
  @ApiPropertyOptional() @Type(() => Number) @IsInt() @Min(0) @IsOptional() capacity?: number;
  @ApiPropertyOptional() @IsDateString() @IsOptional() bookingCutoff?: string;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() isHoliday?: boolean;
}

@Injectable()
export class MealSchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Schedules within an inclusive date range (calendar view). */
  findRange(companyId: string, from: string, to: string) {
    return this.prisma.mealSchedule.findMany({
      where: {
        companyId,
        deletedAt: null,
        serviceDate: { gte: new Date(from), lte: new Date(to) },
      },
      include: { meal: { select: { id: true, name: true, imageUrl: true } } },
      orderBy: { serviceDate: 'asc' },
    });
  }

  async create(companyId: string, dto: CreateScheduleDto) {
    return this.prisma.mealSchedule.upsert({
      where: {
        mealId_serviceDate: { mealId: dto.mealId, serviceDate: new Date(dto.serviceDate) },
      },
      update: {
        capacity: dto.capacity,
        bookingCutoff: dto.bookingCutoff ? new Date(dto.bookingCutoff) : null,
        isHoliday: dto.isHoliday ?? false,
        status: 'OPEN',
      },
      create: {
        companyId,
        mealId: dto.mealId,
        serviceDate: new Date(dto.serviceDate),
        capacity: dto.capacity,
        bookingCutoff: dto.bookingCutoff ? new Date(dto.bookingCutoff) : null,
        isHoliday: dto.isHoliday ?? false,
        status: 'OPEN',
      },
    });
  }

  async setStatus(companyId: string, id: string, status: ScheduleStatus) {
    const schedule = await this.prisma.mealSchedule.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!schedule) throw new NotFoundException('Schedule not found');
    return this.prisma.mealSchedule.update({ where: { id }, data: { status } });
  }

  /** Kitchen production numbers: confirmed bookings per scheduled meal for a day. */
  async productionNumbers(companyId: string, date: string) {
    const schedules = await this.prisma.mealSchedule.findMany({
      where: { companyId, serviceDate: new Date(date), deletedAt: null },
      include: {
        meal: { select: { name: true } },
        _count: { select: { bookings: true } },
      },
    });
    return schedules.map((s) => ({
      scheduleId: s.id,
      meal: s.meal.name,
      capacity: s.capacity,
      booked: s._count.bookings,
    }));
  }

  scheduleWhereOpen(scheduleId: string): Prisma.MealScheduleWhereUniqueInput {
    return { id: scheduleId };
  }
}
