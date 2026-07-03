import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/booking.dto';

@ApiTags('Bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Get()
  @RequirePermissions('bookings:read')
  list(
    @CurrentUser('companyId') companyId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.bookings.list(companyId, query);
  }

  @Get('me')
  @RequirePermissions('bookings:read')
  mine(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('userId') userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.bookings.findMine(companyId, userId, query);
  }

  @Post()
  @RequirePermissions('bookings:create')
  create(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookings.create(companyId, userId, dto);
  }

  @Delete(':id')
  @RequirePermissions('bookings:update')
  cancel(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.bookings.cancel(companyId, id);
  }
}
