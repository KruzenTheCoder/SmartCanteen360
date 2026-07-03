import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LoyaltyTransactionType, Prisma } from '@smartcanteen/database';
import { PrismaService } from '../database/prisma.service';

type Tx = Prisma.TransactionClient;

@Injectable()
export class LoyaltyService {
  constructor(private readonly prisma: PrismaService) {}

  async getAccount(companyId: string, employeeId: string) {
    const account = await this.prisma.loyaltyAccount.findFirst({
      where: { employeeId, employee: { companyId } },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    if (!account) throw new NotFoundException('Loyalty account not found');
    return account;
  }

  /** Post a points movement and keep balance + lifetime totals consistent. */
  async post(
    params: { accountId: string; type: LoyaltyTransactionType; points: number; description?: string },
    client?: Tx,
  ) {
    const run = async (tx: Tx) => {
      const account = await tx.loyaltyAccount.findUnique({ where: { id: params.accountId } });
      if (!account) throw new NotFoundException('Loyalty account not found');

      const isEarn = ['EARN', 'BONUS', 'ADJUSTMENT'].includes(params.type);
      const delta = isEarn ? params.points : -params.points;
      const balanceAfter = account.pointsBalance + delta;
      if (balanceAfter < 0) throw new BadRequestException('Insufficient points');

      const updated = await tx.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          pointsBalance: balanceAfter,
          lifetimePoints: isEarn ? account.lifetimePoints + params.points : account.lifetimePoints,
        },
      });

      await tx.loyaltyTransaction.create({
        data: {
          accountId: account.id,
          type: params.type,
          points: params.points,
          balanceAfter,
          description: params.description,
        },
      });
      return updated;
    };
    return client ? run(client) : this.prisma.$transaction(run);
  }

  listRewards(companyId: string) {
    return this.prisma.reward.findMany({
      where: { companyId, deletedAt: null, status: 'AVAILABLE' },
      orderBy: { pointsCost: 'asc' },
    });
  }

  async redeemReward(companyId: string, employeeId: string, rewardId: string) {
    const [account, reward] = await Promise.all([
      this.getAccount(companyId, employeeId),
      this.prisma.reward.findFirst({ where: { id: rewardId, companyId, deletedAt: null } }),
    ]);
    if (!reward) throw new NotFoundException('Reward not found');
    if (reward.stock != null && reward.stock <= 0) {
      throw new BadRequestException('Reward out of stock');
    }

    return this.prisma.$transaction(async (tx) => {
      await this.post(
        { accountId: account.id, type: 'REDEEM', points: reward.pointsCost, description: `Redeemed: ${reward.name}` },
        tx,
      );
      if (reward.stock != null) {
        await tx.reward.update({ where: { id: reward.id }, data: { stock: { decrement: 1 } } });
      }
      return tx.rewardRedemption.create({
        data: { rewardId: reward.id, accountId: account.id, pointsSpent: reward.pointsCost, status: 'FULFILLED' },
      });
    });
  }

  /** Leaderboard by lifetime points (department competitions / gamification). */
  leaderboard(companyId: string, take = 10) {
    return this.prisma.loyaltyAccount.findMany({
      where: { employee: { companyId, deletedAt: null } },
      include: { employee: { select: { firstName: true, lastName: true, employeeNumber: true } } },
      orderBy: { lifetimePoints: 'desc' },
      take,
    });
  }
}
