import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@smartcanteen/database';
import { PrismaService } from '../database/prisma.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { paginated } from '../common/utils/paginate';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  avatarUrl: true,
  status: true,
  companyId: true,
  lastLoginAt: true,
  createdAt: true,
  roles: { select: { role: { select: { name: true, label: true } } } },
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string | null, query: PaginationQueryDto) {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(companyId ? { companyId } : {}),
      ...(query.search
        ? {
            OR: [
              { email: { contains: query.search, mode: 'insensitive' } },
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: userSelect,
        skip: query.skip,
        take: query.take,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder },
      }),
      this.prisma.user.count({ where }),
    ]);

    return paginated(data, total, query.page, query.pageSize);
  }

  async findOne(companyId: string | null, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null, ...(companyId ? { companyId } : {}) },
      select: userSelect,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(companyId: string | null, dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (exists) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const roles = await this.prisma.role.findMany({
      where: { name: { in: dto.roles } },
      select: { id: true },
    });

    return this.prisma.user.create({
      data: {
        companyId: dto.companyId ?? companyId,
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        status: 'ACTIVE',
        roles: { create: roles.map((r) => ({ roleId: r.id })) },
      },
      select: userSelect,
    });
  }

  async update(companyId: string | null, id: string, dto: UpdateUserDto) {
    await this.findOne(companyId, id);

    if (dto.roles) {
      await this.prisma.userRole.deleteMany({ where: { userId: id } });
      const roles = await this.prisma.role.findMany({
        where: { name: { in: dto.roles } },
        select: { id: true },
      });
      await this.prisma.userRole.createMany({
        data: roles.map((r) => ({ userId: id, roleId: r.id })),
        skipDuplicates: true,
      });
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        status: dto.status,
      },
      select: userSelect,
    });
  }

  async remove(companyId: string | null, id: string) {
    await this.findOne(companyId, id);
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'DISABLED' },
    });
    return { id, deleted: true };
  }
}
