import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('dashboard')
  @RequirePermissions('dashboard:read')
  dashboard(@CurrentUser('companyId') companyId: string) {
    return this.analytics.executiveDashboard(companyId);
  }

  @Get('popular-meals')
  @RequirePermissions('analytics:read')
  popularMeals(
    @CurrentUser('companyId') companyId: string,
    @Query('days') days?: string,
  ) {
    return this.analytics.popularMeals(companyId, days ? Number(days) : 30);
  }

  @Get('revenue-trend')
  @RequirePermissions('analytics:read')
  revenueTrend(
    @CurrentUser('companyId') companyId: string,
    @Query('days') days?: string,
  ) {
    return this.analytics.revenueTrend(companyId, days ? Number(days) : 14);
  }

  @Get('department-usage')
  @RequirePermissions('analytics:read')
  departmentUsage(@CurrentUser('companyId') companyId: string) {
    return this.analytics.departmentUsage(companyId);
  }
}
