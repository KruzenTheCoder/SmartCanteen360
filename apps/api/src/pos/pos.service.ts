import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import {
  PaymentMethod,
  PaymentProvider,
  Prisma,
} from '@smartcanteen/database';
import { PrismaService } from '../database/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { CheckoutDto } from './dto/pos.dto';

/** Points earned per currency unit spent. */
const LOYALTY_EARN_RATE = 0.1;

const METHOD_PROVIDER: Record<PaymentMethod, PaymentProvider> = {
  WALLET: 'WALLET',
  LOYALTY: 'LOYALTY',
  PAYROLL_DEDUCTION: 'PAYROLL',
  CARD: 'YOCO',
  CASH: 'CASH',
  EFT: 'OZOW',
};

@Injectable()
export class PosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
    private readonly loyalty: LoyaltyService,
  ) {}

  private receiptNumber(): string {
    return `RC-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString('hex').toUpperCase()}`;
  }

  /** Look up an employee by scanned QR code (POS scanner flow). */
  async lookupByQr(companyId: string, code: string) {
    const card = await this.prisma.qrCard.findFirst({
      where: { code, isActive: true, employee: { companyId, deletedAt: null } },
      include: {
        employee: {
          include: {
            wallet: { select: { balance: true } },
            loyaltyAccount: { select: { pointsBalance: true } },
          },
        },
      },
    });
    if (!card) throw new NotFoundException('QR card not recognised');
    return card.employee;
  }

  /**
   * Process a POS sale end-to-end in one transaction: persist the sale, take
   * payment via the selected method, issue a receipt and accrue loyalty.
   */
  async checkout(companyId: string, cashierId: string, dto: CheckoutDto) {
    if (dto.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const subtotal = dto.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const discount = dto.discount ?? 0;
    const total = Math.max(0, subtotal - discount);

    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.posTransaction.create({
        data: {
          companyId,
          cashierId,
          employeeId: dto.employeeId,
          receiptNumber: this.receiptNumber(),
          status: 'COMPLETED',
          subtotal: new Prisma.Decimal(subtotal),
          discount: new Prisma.Decimal(discount),
          total: new Prisma.Decimal(total),
          items: {
            create: dto.items.map((i) => ({
              retailProductId: i.retailProductId,
              label: i.label,
              quantity: i.quantity,
              unitPrice: new Prisma.Decimal(i.unitPrice),
              lineTotal: new Prisma.Decimal(i.quantity * i.unitPrice),
            })),
          },
        },
      });

      await this.takePayment(tx, companyId, transaction.id, dto, total);

      await tx.payment.create({
        data: {
          companyId,
          posTransactionId: transaction.id,
          method: dto.method,
          provider: METHOD_PROVIDER[dto.method],
          status: 'CAPTURED',
          amount: new Prisma.Decimal(total),
        },
      });

      const receipt = await tx.receipt.create({
        data: {
          posTransactionId: transaction.id,
          number: transaction.receiptNumber,
        },
      });

      // Deduct retail stock and accrue loyalty for identified employees.
      await this.deductStock(tx, dto);
      if (dto.employeeId && dto.method !== 'LOYALTY') {
        const account = await tx.loyaltyAccount.findUnique({ where: { employeeId: dto.employeeId } });
        if (account) {
          await this.loyalty.post(
            { accountId: account.id, type: 'EARN', points: Math.floor(total * LOYALTY_EARN_RATE), description: `POS ${transaction.receiptNumber}` },
            tx,
          );
        }
      }

      return { transaction, receipt, total };
    });
  }

  private async takePayment(
    tx: Prisma.TransactionClient,
    companyId: string,
    transactionId: string,
    dto: CheckoutDto,
    total: number,
  ) {
    switch (dto.method) {
      case 'WALLET': {
        if (!dto.employeeId) throw new BadRequestException('Wallet payment requires an employee');
        const wallet = await tx.wallet.findFirst({ where: { employeeId: dto.employeeId } });
        if (!wallet) throw new NotFoundException('Employee wallet not found');
        await this.wallet.adjust(
          { walletId: wallet.id, type: 'DEBIT', amount: total, posTransactionId: transactionId, description: 'POS purchase' },
          tx,
        );
        break;
      }
      case 'LOYALTY': {
        if (!dto.employeeId) throw new BadRequestException('Loyalty payment requires an employee');
        const account = await tx.loyaltyAccount.findUnique({ where: { employeeId: dto.employeeId } });
        if (!account) throw new NotFoundException('Loyalty account not found');
        await this.loyalty.post(
          { accountId: account.id, type: 'REDEEM', points: Math.ceil(total), description: 'POS redemption' },
          tx,
        );
        break;
      }
      case 'PAYROLL_DEDUCTION':
      case 'CARD':
      case 'CASH':
      case 'EFT':
        // External / deferred settlement handled by PaymentService adapters.
        break;
    }
  }

  private async deductStock(tx: Prisma.TransactionClient, dto: CheckoutDto) {
    for (const item of dto.items) {
      if (!item.retailProductId) continue;
      const retail = await tx.retailProduct.findUnique({
        where: { id: item.retailProductId },
        select: { inventoryProductId: true },
      });
      if (!retail?.inventoryProductId) continue;
      const product = await tx.inventoryProduct.findUnique({ where: { id: retail.inventoryProductId } });
      if (!product) continue;
      const balanceAfter = product.quantityOnHand.minus(item.quantity);
      await tx.inventoryProduct.update({
        where: { id: product.id },
        data: { quantityOnHand: balanceAfter },
      });
      await tx.stockMovement.create({
        data: {
          productId: product.id,
          type: 'SALE_DEDUCTION',
          quantity: new Prisma.Decimal(-item.quantity),
          balanceAfter,
        },
      });
    }
  }

  async refund(companyId: string, transactionId: string) {
    const transaction = await this.prisma.posTransaction.findFirst({
      where: { id: transactionId, companyId },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.status === 'REFUNDED') {
      throw new BadRequestException('Transaction already refunded');
    }
    return this.prisma.posTransaction.update({
      where: { id: transactionId },
      data: { status: 'REFUNDED' },
    });
  }

  /** Cashier report: totals for a day. */
  async cashierReport(companyId: string, date: string) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const agg = await this.prisma.posTransaction.aggregate({
      where: { companyId, status: 'COMPLETED', createdAt: { gte: start, lt: end } },
      _sum: { total: true },
      _count: { _all: true },
    });
    return { date, salesTotal: agg._sum.total ?? 0, transactions: agg._count._all };
  }

  listRetailProducts(companyId: string) {
    return this.prisma.retailProduct.findMany({
      where: { companyId, isActive: true, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }
}
