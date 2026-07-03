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
import { InventoryService } from './inventory.service';
import {
  CreateProductDto,
  StockAdjustmentDto,
  UpdateProductDto,
} from './dto/inventory.dto';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get('dashboard')
  @RequirePermissions('inventory:read')
  dashboard(@CurrentUser('companyId') companyId: string) {
    return this.inventory.dashboard(companyId);
  }

  @Get('low-stock')
  @RequirePermissions('inventory:read')
  lowStock(@CurrentUser('companyId') companyId: string) {
    return this.inventory.lowStock(companyId);
  }

  @Get('categories')
  @RequirePermissions('inventory:read')
  categories(@CurrentUser('companyId') companyId: string) {
    return this.inventory.listCategories(companyId);
  }

  @Post('categories')
  @RequirePermissions('inventory:create')
  createCategory(
    @CurrentUser('companyId') companyId: string,
    @Body('name') name: string,
  ) {
    return this.inventory.createCategory(companyId, name);
  }

  @Get()
  @RequirePermissions('inventory:read')
  findAll(
    @CurrentUser('companyId') companyId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.inventory.findAll(companyId, query);
  }

  @Get(':id')
  @RequirePermissions('inventory:read')
  findOne(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    return this.inventory.findOne(companyId, id);
  }

  @Post()
  @RequirePermissions('inventory:create')
  create(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.inventory.create(companyId, dto);
  }

  @Patch(':id')
  @RequirePermissions('inventory:update')
  update(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.inventory.update(companyId, id, dto);
  }

  @Post(':id/adjust')
  @RequirePermissions('inventory:update')
  adjust(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: StockAdjustmentDto,
  ) {
    return this.inventory.adjustStock(companyId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('inventory:delete')
  remove(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    return this.inventory.remove(companyId, id);
  }
}
