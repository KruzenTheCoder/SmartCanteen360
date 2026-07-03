import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificationType } from '@smartcanteen/database';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @RequirePermissions('notifications:read')
  list(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.notifications.listForUser(companyId, userId);
  }

  @Get('unread-count')
  @RequirePermissions('notifications:read')
  unread(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.notifications.unreadCount(companyId, userId);
  }

  @Post('read-all')
  @RequirePermissions('notifications:read')
  readAll(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.notifications.markAllRead(companyId, userId);
  }

  @Post(':id/read')
  @RequirePermissions('notifications:read')
  read(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.notifications.markRead(userId, id);
  }

  @Post('broadcast')
  @RequirePermissions('notifications:create')
  broadcast(
    @CurrentUser('companyId') companyId: string,
    @Body() body: { title: string; body: string; type?: NotificationType },
  ) {
    return this.notifications.create(companyId, {
      title: body.title,
      body: body.body,
      type: body.type ?? 'ANNOUNCEMENT',
    });
  }
}
