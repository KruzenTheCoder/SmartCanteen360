import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreateCampaignDto,
  CreatePromotionDto,
  PromotionsService,
} from './promotions.service';

@ApiTags('Promotions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotions: PromotionsService) {}

  @Get('campaigns')
  @RequirePermissions('promotions:read')
  campaigns(@CurrentUser('companyId') companyId: string) {
    return this.promotions.listCampaigns(companyId);
  }

  @Post('campaigns')
  @RequirePermissions('promotions:create')
  createCampaign(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateCampaignDto,
  ) {
    return this.promotions.createCampaign(companyId, dto);
  }

  @Get()
  @RequirePermissions('promotions:read')
  list(@CurrentUser('companyId') companyId: string) {
    return this.promotions.listPromotions(companyId);
  }

  @Post()
  @RequirePermissions('promotions:create')
  create(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreatePromotionDto,
  ) {
    return this.promotions.createPromotion(companyId, dto);
  }

  @Patch(':id/active')
  @RequirePermissions('promotions:update')
  setActive(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.promotions.setPromotionActive(companyId, id, isActive);
  }

  @Delete(':id')
  @RequirePermissions('promotions:delete')
  remove(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    return this.promotions.remove(companyId, id);
  }
}
