import { Injectable } from '@nestjs/common';
import { AuditAction, Prisma } from '@smartcanteen/database';
import { PrismaService } from '../database/prisma.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { paginated } from '../common/utils/paginate';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string | null, query: PaginationQueryDto) {
    const where: Prisma.AuditLogWhereInput = {
      ...(companyId ? { companyId } : {}),
      ...(query.search ? { entity: { contains: query.search, mode: 'insensitive' } } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        include: { user: { select: { email: true } } },
        skip: query.skip,
        take: query.take,
        orderBy: { createdAt: query.sortOrder },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return paginated(data, total, query.page, query.pageSize);
  }

  /** Append an audit entry. Called by services/interceptors on mutations. */
  record(params: {
    companyId?: string | null;
    userId?: string | null;
    action: AuditAction;
    entity: string;
    entityId?: string;
    before?: Prisma.InputJsonValue;
    after?: Prisma.InputJsonValue;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        companyId: params.companyId ?? null,
        userId: params.userId ?? null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        before: params.before,
        after: params.after,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  }
}
