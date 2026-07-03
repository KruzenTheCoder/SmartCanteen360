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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@ApiTags('Employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  @Get()
  @RequirePermissions('employees:read')
  findAll(
    @CurrentUser('companyId') companyId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.employees.findAll(companyId, query);
  }

  @Get('analytics')
  @RequirePermissions('employees:read')
  @ApiOperation({ summary: 'Employee headcount analytics' })
  analytics(@CurrentUser('companyId') companyId: string) {
    return this.employees.analytics(companyId);
  }

  @Get(':id')
  @RequirePermissions('employees:read')
  findOne(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.employees.findOne(companyId, id);
  }

  @Post()
  @RequirePermissions('employees:create')
  create(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateEmployeeDto,
  ) {
    return this.employees.create(companyId, dto);
  }

  @Post('import')
  @RequirePermissions('employees:create')
  @ApiOperation({ summary: 'Bulk import employees' })
  bulkImport(
    @CurrentUser('companyId') companyId: string,
    @Body() rows: CreateEmployeeDto[],
  ) {
    return this.employees.bulkImport(companyId, rows);
  }

  @Patch(':id')
  @RequirePermissions('employees:update')
  update(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.employees.update(companyId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('employees:delete')
  remove(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.employees.remove(companyId, id);
  }
}
