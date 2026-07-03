import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, WalletTransactionType } from '@smartcanteen/database';
import { PrismaService } from '../database/prisma.service';

type Tx = Prisma.TransactionClient;

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getByEmployee(companyId: string, employeeId: string) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { employeeId, employee: { companyId } },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }

  transactions(employeeId: string, take = 50) {
    return this.prisma.walletTransaction.findMany({
      where: { wallet: { employeeId } },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  /**
   * Adjust a wallet balance and append a ledger entry atomically. Can join an
   * existing transaction (e.g. a POS checkout) via the optional `client`.
   */
  async adjust(
    params: {
      walletId: string;
      type: WalletTransactionType;
      amount: Prisma.Decimal | number;
      reference?: string;
      description?: string;
      posTransactionId?: string;
    },
    client?: Tx,
  ) {
    const run = async (tx: Tx) => {
      const wallet = await tx.wallet.findUnique({ where: { id: params.walletId } });
      if (!wallet) throw new NotFoundException('Wallet not found');

      const amount = new Prisma.Decimal(params.amount);
      const isDebit = ['DEBIT'].includes(params.type);
      const delta = isDebit ? amount.negated() : amount;
      const balanceAfter = wallet.balance.plus(delta);

      if (balanceAfter.lessThan(0)) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: params.type,
          amount,
          balanceAfter,
          reference: params.reference,
          description: params.description,
          posTransactionId: params.posTransactionId,
        },
      });

      return updated;
    };

    return client ? run(client) : this.prisma.$transaction(run);
  }

  async credit(companyId: string, employeeId: string, amount: number, type: WalletTransactionType = 'CREDIT', description?: string) {
    const wallet = await this.getByEmployee(companyId, employeeId);
    return this.adjust({ walletId: wallet.id, type, amount, description });
  }

  async debit(companyId: string, employeeId: string, amount: number, description?: string) {
    const wallet = await this.getByEmployee(companyId, employeeId);
    return this.adjust({ walletId: wallet.id, type: 'DEBIT', amount, description });
  }
}
