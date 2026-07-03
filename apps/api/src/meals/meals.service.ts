import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@smartcanteen/database';
import { PrismaService } from '../database/prisma.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { paginated } from '../common/utils/paginate';
import {
  CreateMealCategoryDto,
  CreateMealDto,
  UpdateMealDto,
} from './dto/meal.dto';

@Injectable()
export class MealsService {
  constructor(private readonly prisma: PrismaService) {}

  private toDecimal(value: number | undefined) {
    return value === undefined ? undefined : new Prisma.Decimal(value);
  }

  async findAll(companyId: string, query: PaginationQueryDto) {
    const where: Prisma.MealWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.meal.findMany({
        where,
        include: { category: true, nutrition: true, allergens: true },
        skip: query.skip,
        take: query.take,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder },
      }),
      this.prisma.meal.count({ where }),
    ]);
    return paginated(data, total, query.page, query.pageSize);
  }

  async findOne(companyId: string, id: string) {
    const meal = await this.prisma.meal.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { category: true, nutrition: true, allergens: true, ingredients: true },
    });
    if (!meal) throw new NotFoundException('Meal not found');
    return meal;
  }

  create(companyId: string, dto: CreateMealDto) {
    return this.prisma.meal.create({
      data: {
        companyId,
        name: dto.name,
        description: dto.description,
        imageUrl: dto.imageUrl,
        categoryId: dto.categoryId,
        costPrice: this.toDecimal(dto.costPrice) ?? new Prisma.Decimal(0),
        retailPrice: this.toDecimal(dto.retailPrice) ?? new Prisma.Decimal(0),
        subsidyPrice: this.toDecimal(dto.subsidyPrice) ?? new Prisma.Decimal(0),
        capacity: dto.capacity,
        status: dto.status ?? 'DRAFT',
      },
      include: { category: true },
    });
  }

  async update(companyId: string, id: string, dto: UpdateMealDto) {
    await this.findOne(companyId, id);
    return this.prisma.meal.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        imageUrl: dto.imageUrl,
        categoryId: dto.categoryId,
        costPrice: this.toDecimal(dto.costPrice),
        retailPrice: this.toDecimal(dto.retailPrice),
        subsidyPrice: this.toDecimal(dto.subsidyPrice),
        capacity: dto.capacity,
        status: dto.status,
      },
      include: { category: true },
    });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    await this.prisma.meal.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });
    return { id, deleted: true };
  }

  listCategories(companyId: string) {
    return this.prisma.mealCategory.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
  }

  createCategory(companyId: string, dto: CreateMealCategoryDto) {
    return this.prisma.mealCategory.create({
      data: { companyId, name: dto.name },
    });
  }
}
