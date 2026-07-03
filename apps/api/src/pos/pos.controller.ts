import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PosService } from './pos.service';
import { CheckoutDto } from './dto/pos.dto';

@ApiTags('POS')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('pos')
export class PosController {
  constructor(private readonly pos: PosService) {}

  @Get('products')
  @RequirePermissions('pos:read')
  products(@CurrentUser('companyId') companyId: string) {
    return this.pos.listRetailProducts(companyId);
  }

  @Get('lookup/:code')
  @RequirePermissions('pos:read')
  lookup(
    @CurrentUser('companyId') companyId: string,
    @Param('code') code: string,
  ) {
    return this.pos.lookupByQr(companyId, code);
  }

  @Post('checkout')
  @RequirePermissions('pos:create')
  checkout(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('userId') cashierId: string,
    @Body() dto: CheckoutDto,
  ) {
    return this.pos.checkout(companyId, cashierId, dto);
  }

  @Post(':id/refund')
  @RequirePermissions('pos:update')
  refund(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.pos.refund(companyId, id);
  }

  @Get('report')
  @RequirePermissions('pos:read')
  @ApiQuery({ name: 'date', example: '2026-07-02' })
  report(
    @CurrentUser('companyId') companyId: string,
    @Query('date') date: string,
  ) {
    return this.pos.cashierReport(companyId, date);
  }
}
