import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SettingsService } from './settings.service';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  @RequirePermissions('settings:read')
  list(@CurrentUser('companyId') companyId: string) {
    return this.settings.list(companyId);
  }

  @Get(':key')
  @RequirePermissions('settings:read')
  get(
    @CurrentUser('companyId') companyId: string,
    @Param('key') key: string,
  ) {
    return this.settings.get(companyId, key);
  }

  @Put(':key')
  @RequirePermissions('settings:update')
  upsert(
    @CurrentUser('companyId') companyId: string,
    @Param('key') key: string,
    @Body('value') value: unknown,
  ) {
    return this.settings.upsert(companyId, key, value as never);
  }
}
