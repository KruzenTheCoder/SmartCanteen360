import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @RequirePermissions('users:read')
  findAll(
    @CurrentUser('companyId') companyId: string | null,
    @Query() query: PaginationQueryDto,
  ) {
    return this.users.findAll(companyId, query);
  }

  @Get(':id')
  @RequirePermissions('users:read')
  findOne(
    @CurrentUser('companyId') companyId: string | null,
    @Param('id') id: string,
  ) {
    return this.users.findOne(companyId, id);
  }

  @Post()
  @RequirePermissions('users:create')
  create(
    @CurrentUser('companyId') companyId: string | null,
    @Body() dto: CreateUserDto,
  ) {
    return this.users.create(companyId, dto);
  }

  @Patch(':id')
  @RequirePermissions('users:update')
  update(
    @CurrentUser('companyId') companyId: string | null,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.users.update(companyId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('users:delete')
  remove(
    @CurrentUser('companyId') companyId: string | null,
    @Param('id') id: string,
  ) {
    return this.users.remove(companyId, id);
  }
}
