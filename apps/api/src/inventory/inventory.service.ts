import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@smartcanteen/database';
import { PrismaService } from '../database/prisma.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { paginated } from '../common/utils/paginate';
import {
  CreateProductDto,
  StockAdjustmentDto,
  UpdateProductDto,
} from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string, query: PaginationQueryDto) {
    const where: Prisma.InventoryProductWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { sku: { contains: query.search, mode: 'insensitive' } },
              { barcode: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.inventoryProduct.findMany({
        where,
        include: { category: { select: { id: true, name: true } } },
        skip: query.skip,
        take: query.take,
        orderBy: { [query.sortBy ?? 'name']: query.sortOrder },
      }),
      this.prisma.inventoryProduct.count({ where }),
    ]);
    return paginated(data, total, query.page, query.pageSize);
  }

  async findOne(companyId: string, id: string) {
    const product = await this.prisma.inventoryProduct.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { category: true, stockMovements: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  create(companyId: string, dto: CreateProductDto) {
    return this.prisma.inventoryProduct.create({
      data: {
        companyId,
        sku: dto.sku,
        name: dto.name,
        unit: dto.unit ?? 'unit',
        categoryId: dto.categoryId,
        barcode: dto.barcode,
        reorderLevel: new Prisma.Decimal(dto.reorderLevel ?? 0),
        unitCost: new Prisma.Decimal(dto.unitCost ?? 0),
      },
    });
  }

  async update(companyId: string, id: string, dto: UpdateProductDto) {
    await this.findOne(companyId, id);
    return this.prisma.inventoryProduct.update({
      where: { id },
      data: {
        name: dto.name,
        unit: dto.unit,
        categoryId: dto.categoryId,
        barcode: dto.barcode,
        ...(dto.reorderLevel !== undefined ? { reorderLevel: new Prisma.Decimal(dto.reorderLevel) } : {}),
        ...(dto.unitCost !== undefined ? { unitCost: new Prisma.Decimal(dto.unitCost) } : {}),
      },
    });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    await this.prisma.inventoryProduct.update({ where: { id }, data: { deletedAt: new Date() } });
    return { id, deleted: true };
  }

  /** Apply a stock movement and update on-hand quantity atomically. */
  async adjustStock(companyId: string, id: string, dto: StockAdjustmentDto) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.inventoryProduct.findFirst({
        where: { id, companyId, deletedAt: null },
      });
      if (!product) throw new NotFoundException('Product not found');

      const delta = new Prisma.Decimal(dto.quantity);
      const balanceAfter = product.quantityOnHand.plus(delta);

      const updated = await tx.inventoryProduct.update({
        where: { id },
        data: { quantityOnHand: balanceAfter },
      });
      await tx.stockMovement.create({
        data: {
          productId: id,
          type: dto.type,
          quantity: delta,
          balanceAfter,
          note: dto.note,
        },
      });
      return updated;
    });
  }

  /** Low-stock alerts: products at or below their reorder level. */
  lowStock(companyId: string) {
    return this.prisma.$queryRaw`
      SELECT id, sku, name, "quantityOnHand", "reorderLevel"
      FROM inventory_products
      WHERE "companyId" = ${companyId}
        AND "deletedAt" IS NULL
        AND "quantityOnHand" <= "reorderLevel"
      ORDER BY "quantityOnHand" ASC`;
  }

  async dashboard(companyId: string) {
    const [count, value] = await Promise.all([
      this.prisma.inventoryProduct.count({ where: { companyId, deletedAt: null } }),
      this.prisma.$queryRaw<{ total: string }[]>`
        SELECT COALESCE(SUM("quantityOnHand" * "unitCost"), 0) AS total
        FROM inventory_products
        WHERE "companyId" = ${companyId} AND "deletedAt" IS NULL`,
    ]);
    return { productCount: count, inventoryValue: Number(value[0]?.total ?? 0) };
  }

  listCategories(companyId: string) {
    return this.prisma.inventoryCategory.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  createCategory(companyId: string, name: string) {
    return this.prisma.inventoryCategory.create({ data: { companyId, name } });
  }
}
