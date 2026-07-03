import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import { Prisma } from '@smartcanteen/database';
import { PrismaService } from '../database/prisma.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { paginated } from '../common/utils/paginate';
import { EmployeesRepository } from './employees.repository';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly repo: EmployeesRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(companyId: string, query: PaginationQueryDto) {
    const where: Prisma.EmployeeWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              { employeeNumber: { contains: query.search, mode: 'insensitive' } },
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const orderBy = { [query.sortBy ?? 'createdAt']: query.sortOrder };
    const [data, total] = await Promise.all([
      this.repo.findMany(where, query.skip, query.take, orderBy),
      this.repo.count(where),
    ]);
    return paginated(data, total, query.page, query.pageSize);
  }

  async findOne(companyId: string, id: string) {
    const employee = await this.repo.findById(companyId, id);
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  /**
   * Creates an employee and provisions their wallet, loyalty account and QR
   * card in a single transaction so the employee is never partially set up.
   */
  async create(companyId: string, dto: CreateEmployeeDto) {
    const existing = await this.repo.findByNumber(companyId, dto.employeeNumber);
    if (existing) {
      throw new ConflictException(`Employee number ${dto.employeeNumber} already exists`);
    }

    const data: Prisma.EmployeeCreateInput = {
      company: { connect: { id: companyId } },
      employeeNumber: dto.employeeNumber,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      mealSubsidy: new Prisma.Decimal(dto.mealSubsidy ?? 0),
      status: dto.status ?? 'ACTIVE',
      ...(dto.departmentId ? { department: { connect: { id: dto.departmentId } } } : {}),
      ...(dto.costCentreId ? { costCentre: { connect: { id: dto.costCentreId } } } : {}),
      wallet: { create: { balance: new Prisma.Decimal(0) } },
      loyaltyAccount: { create: {} },
      qrCard: {
        create: {
          code: randomUUID(),
          encryptedData: randomBytes(24).toString('hex'),
        },
      },
    };
    return this.repo.create(data);
  }

  async update(companyId: string, id: string, dto: UpdateEmployeeDto) {
    await this.findOne(companyId, id);
    const data: Prisma.EmployeeUpdateInput = {
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      status: dto.status,
      ...(dto.mealSubsidy !== undefined
        ? { mealSubsidy: new Prisma.Decimal(dto.mealSubsidy) }
        : {}),
      ...(dto.departmentId ? { department: { connect: { id: dto.departmentId } } } : {}),
      ...(dto.costCentreId ? { costCentre: { connect: { id: dto.costCentreId } } } : {}),
    };
    return this.repo.update(id, data);
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    await this.repo.softDelete(id);
    return { id, deleted: true };
  }

  /** Bulk import used by the CSV/Excel upload endpoint. */
  async bulkImport(companyId: string, rows: CreateEmployeeDto[]) {
    const results = { created: 0, skipped: 0, errors: [] as string[] };
    for (const row of rows) {
      try {
        await this.create(companyId, row);
        results.created += 1;
      } catch (err) {
        results.skipped += 1;
        results.errors.push(
          `${row.employeeNumber}: ${err instanceof Error ? err.message : 'unknown error'}`,
        );
      }
    }
    return results;
  }

  /** Simple department-usage analytics for the employee dashboard widget. */
  async analytics(companyId: string) {
    const byDepartment = await this.prisma.employee.groupBy({
      by: ['departmentId'],
      where: { companyId, deletedAt: null },
      _count: { _all: true },
    });
    const total = byDepartment.reduce((sum, d) => sum + d._count._all, 0);
    return { total, byDepartment };
  }
}
