import { Injectable, NotFoundException } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { Prisma, PurchaseOrderStatus } from '@smartcanteen/database';
import { PrismaService } from '../database/prisma.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { paginated } from '../common/utils/paginate';

export class CreateSupplierDto {
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsString() @IsOptional() contactName?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() email?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() phone?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() address?: string;
}

class PoLineDto {
  @ApiProperty() @IsString() productId!: string;
  @ApiProperty() @Type(() => Number) @IsNumber() quantity!: number;
  @ApiProperty() @Type(() => Number) @IsNumber() unitCost!: number;
}

export class CreatePurchaseOrderDto {
  @ApiProperty() @IsString() supplierId!: string;
  @ApiProperty({ type: [PoLineDto] }) @IsArray() lines!: PoLineDto[];
}

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string, query: PaginationQueryDto) {
    const where: Prisma.SupplierWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.supplier.findMany({ where, skip: query.skip, take: query.take, orderBy: { name: 'asc' } }),
      this.prisma.supplier.count({ where }),
    ]);
    return paginated(data, total, query.page, query.pageSize);
  }

  async findOne(companyId: string, id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { purchaseOrders: { orderBy: { orderDate: 'desc' }, take: 20 } },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  create(companyId: string, dto: CreateSupplierDto) {
    return this.prisma.supplier.create({ data: { companyId, ...dto } });
  }

  async update(companyId: string, id: string, dto: Partial<CreateSupplierDto>) {
    await this.findOne(companyId, id);
    return this.prisma.supplier.update({ where: { id }, data: dto });
  }

  async remove(companyId: string, id: string) {
    await this.findOne(companyId, id);
    await this.prisma.supplier.update({ where: { id }, data: { deletedAt: new Date() } });
    return { id, deleted: true };
  }

  async createPurchaseOrder(companyId: string, dto: CreatePurchaseOrderDto) {
    const subtotal = dto.lines.reduce((sum, l) => sum + l.quantity * l.unitCost, 0);
    const orderNumber = `PO-${Date.now().toString(36).toUpperCase()}`;
    return this.prisma.purchaseOrder.create({
      data: {
        companyId,
        supplierId: dto.supplierId,
        orderNumber,
        status: 'SUBMITTED',
        subtotal: new Prisma.Decimal(subtotal),
        total: new Prisma.Decimal(subtotal),
        items: {
          create: dto.lines.map((l) => ({
            productId: l.productId,
            quantityOrdered: new Prisma.Decimal(l.quantity),
            unitCost: new Prisma.Decimal(l.unitCost),
            lineTotal: new Prisma.Decimal(l.quantity * l.unitCost),
          })),
        },
      },
      include: { items: true },
    });
  }

  listPurchaseOrders(companyId: string) {
    return this.prisma.purchaseOrder.findMany({
      where: { companyId, deletedAt: null },
      include: { supplier: { select: { name: true } } },
      orderBy: { orderDate: 'desc' },
    });
  }

  /** Receive a PO: bump stock for each line and mark the order received. */
  async receivePurchaseOrder(companyId: string, poId: string) {
    return this.prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findFirst({
        where: { id: poId, companyId, deletedAt: null },
        include: { items: true },
      });
      if (!po) throw new NotFoundException('Purchase order not found');

      for (const item of po.items) {
        const product = await tx.inventoryProduct.findUnique({ where: { id: item.productId } });
        if (!product) continue;
        const balanceAfter = product.quantityOnHand.plus(item.quantityOrdered);
        await tx.inventoryProduct.update({
          where: { id: item.productId },
          data: { quantityOnHand: balanceAfter, unitCost: item.unitCost },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'PURCHASE_RECEIPT',
            quantity: item.quantityOrdered,
            balanceAfter,
            unitCost: item.unitCost,
            reference: po.orderNumber,
          },
        });
        await tx.purchaseOrderItem.update({
          where: { id: item.id },
          data: { quantityReceived: item.quantityOrdered },
        });
      }

      return tx.purchaseOrder.update({
        where: { id: poId },
        data: { status: PurchaseOrderStatus.RECEIVED, receivedAt: new Date() },
      });
    });
  }
}
