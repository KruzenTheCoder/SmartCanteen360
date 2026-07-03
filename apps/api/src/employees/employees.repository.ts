import { Injectable } from '@nestjs/common';
import { Prisma } from '@smartcanteen/database';
import { PrismaService } from '../database/prisma.service';

/**
 * Data-access layer for employees. Encapsulates all Prisma queries and the
 * soft-delete filter so services stay free of persistence details.
 */
@Injectable()
export class EmployeesRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly include = {
    department: { select: { id: true, name: true } },
    costCentre: { select: { id: true, code: true, name: true } },
    wallet: { select: { id: true, balance: true } },
    loyaltyAccount: { select: { id: true, pointsBalance: true, tier: true } },
    qrCard: { select: { code: true, isActive: true } },
  } satisfies Prisma.EmployeeInclude;

  async findMany(where: Prisma.EmployeeWhereInput, skip: number, take: number, orderBy: Prisma.EmployeeOrderByWithRelationInput) {
    return this.prisma.employee.findMany({ where, include: this.include, skip, take, orderBy });
  }

  count(where: Prisma.EmployeeWhereInput) {
    return this.prisma.employee.count({ where });
  }

  findById(companyId: string, id: string) {
    return this.prisma.employee.findFirst({
      where: { id, companyId, deletedAt: null },
      include: this.include,
    });
  }

  findByNumber(companyId: string, employeeNumber: string) {
    return this.prisma.employee.findFirst({
      where: { companyId, employeeNumber, deletedAt: null },
    });
  }

  create(data: Prisma.EmployeeCreateInput) {
    return this.prisma.employee.create({ data, include: this.include });
  }

  update(id: string, data: Prisma.EmployeeUpdateInput) {
    return this.prisma.employee.update({ where: { id }, data, include: this.include });
  }

  softDelete(id: string) {
    return this.prisma.employee.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'TERMINATED' },
    });
  }
}
