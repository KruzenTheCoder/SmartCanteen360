import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { LoyaltyService } from './loyalty.service';

@ApiTags('Loyalty')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyalty: LoyaltyService) {}

  @Get('rewards')
  @RequirePermissions('loyalty:read')
  rewards(@CurrentUser('companyId') companyId: string) {
    return this.loyalty.listRewards(companyId);
  }

  @Get('leaderboard')
  @RequirePermissions('loyalty:read')
  leaderboard(@CurrentUser('companyId') companyId: string) {
    return this.loyalty.leaderboard(companyId);
  }

  @Get(':employeeId')
  @RequirePermissions('loyalty:read')
  account(
    @CurrentUser('companyId') companyId: string,
    @Param('employeeId') employeeId: string,
  ) {
    return this.loyalty.getAccount(companyId, employeeId);
  }

  @Post(':employeeId/redeem/:rewardId')
  @RequirePermissions('loyalty:update')
  redeem(
    @CurrentUser('companyId') companyId: string,
    @Param('employeeId') employeeId: string,
    @Param('rewardId') rewardId: string,
  ) {
    return this.loyalty.redeemReward(companyId, employeeId, rewardId);
  }

  @Post(':employeeId/adjust')
  @RequirePermissions('loyalty:update')
  async adjust(
    @CurrentUser('companyId') companyId: string,
    @Param('employeeId') employeeId: string,
    @Body() body: { points: number; description?: string },
  ) {
    const account = await this.loyalty.getAccount(companyId, employeeId);
    return this.loyalty.post({
      accountId: account.id,
      type: 'ADJUSTMENT',
      points: body.points,
      description: body.description,
    });
  }
}
