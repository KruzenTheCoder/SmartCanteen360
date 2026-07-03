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
import {
  CreatePurchaseOrderDto,
  CreateSupplierDto,
  SuppliersService,
} from './suppliers.service';

@ApiTags('Suppliers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliers: SuppliersService) {}

  @Get()
  @RequirePermissions('suppliers:read')
  findAll(
    @CurrentUser('companyId') companyId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.suppliers.findAll(companyId, query);
  }

  @Get('purchase-orders')
  @RequirePermissions('purchase-orders:read')
  listPos(@CurrentUser('companyId') companyId: string) {
    return this.suppliers.listPurchaseOrders(companyId);
  }

  @Post('purchase-orders')
  @RequirePermissions('purchase-orders:create')
  createPo(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreatePurchaseOrderDto,
  ) {
    return this.suppliers.createPurchaseOrder(companyId, dto);
  }

  @Post('purchase-orders/:id/receive')
  @RequirePermissions('purchase-orders:approve')
  receivePo(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
  ) {
    return this.suppliers.receivePurchaseOrder(companyId, id);
  }

  @Get(':id')
  @RequirePermissions('suppliers:read')
  findOne(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    return this.suppliers.findOne(companyId, id);
  }

  @Post()
  @RequirePermissions('suppliers:create')
  create(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateSupplierDto,
  ) {
    return this.suppliers.create(companyId, dto);
  }

  @Patch(':id')
  @RequirePermissions('suppliers:update')
  update(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateSupplierDto>,
  ) {
    return this.suppliers.update(companyId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('suppliers:delete')
  remove(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    return this.suppliers.remove(companyId, id);
  }
}
