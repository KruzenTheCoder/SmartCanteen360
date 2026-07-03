import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { WalletTransactionType } from '@smartcanteen/database';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WalletService } from './wallet.service';

@ApiTags('Wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Get(':employeeId')
  @RequirePermissions('wallet:read')
  get(
    @CurrentUser('companyId') companyId: string,
    @Param('employeeId') employeeId: string,
  ) {
    return this.wallet.getByEmployee(companyId, employeeId);
  }

  @Get(':employeeId/transactions')
  @RequirePermissions('wallet:read')
  transactions(@Param('employeeId') employeeId: string) {
    return this.wallet.transactions(employeeId);
  }

  @Post(':employeeId/topup')
  @RequirePermissions('wallet:update')
  topup(
    @CurrentUser('companyId') companyId: string,
    @Param('employeeId') employeeId: string,
    @Body() body: { amount: number; payroll?: boolean; description?: string },
  ) {
    const type: WalletTransactionType = body.payroll ? 'PAYROLL_TOPUP' : 'CREDIT';
    return this.wallet.credit(companyId, employeeId, body.amount, type, body.description);
  }

  @Post(':employeeId/refund')
  @RequirePermissions('wallet:update')
  refund(
    @CurrentUser('companyId') companyId: string,
    @Param('employeeId') employeeId: string,
    @Body() body: { amount: number; description?: string },
  ) {
    return this.wallet.credit(companyId, employeeId, body.amount, 'REFUND', body.description);
  }
}
