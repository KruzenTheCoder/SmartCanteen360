import { Injectable } from '@nestjs/common';
import { Prisma } from '@smartcanteen/database';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  list(companyId: string) {
    return this.prisma.setting.findMany({
      where: { companyId },
      orderBy: { key: 'asc' },
    });
  }

  async get(companyId: string, key: string) {
    const setting = await this.prisma.setting.findUnique({
      where: { companyId_key: { companyId, key } },
    });
    return setting?.value ?? null;
  }

  upsert(companyId: string, key: string, value: Prisma.InputJsonValue) {
    return this.prisma.setting.upsert({
      where: { companyId_key: { companyId, key } },
      update: { value },
      create: { companyId, key, value },
    });
  }
}
