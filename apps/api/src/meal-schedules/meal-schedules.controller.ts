import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ScheduleStatus } from '@smartcanteen/database';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateScheduleDto, MealSchedulesService } from './meal-schedules.service';

@ApiTags('Meal Scheduler')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('meal-schedules')
export class MealSchedulesController {
  constructor(private readonly schedules: MealSchedulesService) {}

  @Get()
  @RequirePermissions('meal-schedules:read')
  @ApiQuery({ name: 'from', example: '2026-07-01' })
  @ApiQuery({ name: 'to', example: '2026-07-31' })
  findRange(
    @CurrentUser('companyId') companyId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.schedules.findRange(companyId, from, to);
  }

  @Get('production')
  @RequirePermissions('meal-schedules:read')
  @ApiQuery({ name: 'date', example: '2026-07-02' })
  production(
    @CurrentUser('companyId') companyId: string,
    @Query('date') date: string,
  ) {
    return this.schedules.productionNumbers(companyId, date);
  }

  @Post()
  @RequirePermissions('meal-schedules:create')
  create(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateScheduleDto,
  ) {
    return this.schedules.create(companyId, dto);
  }

  @Patch(':id/status')
  @RequirePermissions('meal-schedules:update')
  setStatus(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
    @Body('status') status: ScheduleStatus,
  ) {
    return this.schedules.setStatus(companyId, id, status);
  }
}
