import { Injectable, NotFoundException } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, IsEnum } from 'class-validator';
import { PromotionType, Prisma } from '@smartcanteen/database';
import { PrismaService } from '../database/prisma.service';

export class CreateCampaignDto {
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsString() @IsOptional() description?: string;
}

export class CreatePromotionDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty({ enum: PromotionType }) @IsEnum(PromotionType) type!: PromotionType;
  @ApiPropertyOptional({ description: 'Rule payload, e.g. { "percent": 15, "category": "BURGER" }' })
  @IsObject() @IsOptional() rules?: Prisma.InputJsonValue;
  @ApiPropertyOptional() @IsString() @IsOptional() campaignId?: string;
}

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  listCampaigns(companyId: string) {
    return this.prisma.campaign.findMany({
      where: { companyId, deletedAt: null },
      include: { promotions: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  createCampaign(companyId: string, dto: CreateCampaignDto) {
    return this.prisma.campaign.create({
      data: { companyId, name: dto.name, description: dto.description, status: 'DRAFT' },
    });
  }

  listPromotions(companyId: string) {
    return this.prisma.promotion.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { priority: 'desc' },
    });
  }

  createPromotion(companyId: string, dto: CreatePromotionDto) {
    return this.prisma.promotion.create({
      data: {
        companyId,
        campaignId: dto.campaignId,
        name: dto.name,
        type: dto.type,
        rules: dto.rules ?? {},
      },
    });
  }

  async setPromotionActive(companyId: string, id: string, isActive: boolean) {
    const promo = await this.prisma.promotion.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!promo) throw new NotFoundException('Promotion not found');
    return this.prisma.promotion.update({ where: { id }, data: { isActive } });
  }

  async remove(companyId: string, id: string) {
    const promo = await this.prisma.promotion.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!promo) throw new NotFoundException('Promotion not found');
    await this.prisma.promotion.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    return { id, deleted: true };
  }
}
