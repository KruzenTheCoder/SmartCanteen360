import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { KitchenService } from './kitchen.service';

@ApiTags('Kitchen')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('kitchen')
export class KitchenController {
  constructor(private readonly kitchen: KitchenService) {}

  @Get('dashboard')
  @RequirePermissions('kitchen:read')
  @ApiQuery({ name: 'date', example: '2026-07-02' })
  dashboard(
    @CurrentUser('companyId') companyId: string,
    @Query('date') date: string,
  ) {
    return this.kitchen.dashboard(companyId, date);
  }

  @Get('queue')
  @RequirePermissions('kitchen:read')
  @ApiQuery({ name: 'date', example: '2026-07-02' })
  queue(
    @CurrentUser('companyId') companyId: string,
    @Query('date') date: string,
  ) {
    return this.kitchen.collectionQueue(companyId, date);
  }

  @Post('collect/:bookingId')
  @RequirePermissions('kitchen:update')
  collect(
    @CurrentUser('companyId') companyId: string,
    @Param('bookingId') bookingId: string,
  ) {
    return this.kitchen.markCollected(companyId, bookingId);
  }

  @Post('waste')
  @RequirePermissions('kitchen:update')
  waste(
    @CurrentUser('companyId') companyId: string,
    @Body()
    body: { itemLabel: string; quantity: number; unit?: string; reason: string; estimatedCost?: number },
  ) {
    return this.kitchen.recordWaste(companyId, body);
  }
}
