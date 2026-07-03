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
import { MealsService } from './meals.service';
import {
  CreateMealCategoryDto,
  CreateMealDto,
  UpdateMealDto,
} from './dto/meal.dto';

@ApiTags('Meals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('meals')
export class MealsController {
  constructor(private readonly meals: MealsService) {}

  @Get()
  @RequirePermissions('meals:read')
  findAll(
    @CurrentUser('companyId') companyId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.meals.findAll(companyId, query);
  }

  @Get('categories')
  @RequirePermissions('meals:read')
  listCategories(@CurrentUser('companyId') companyId: string) {
    return this.meals.listCategories(companyId);
  }

  @Post('categories')
  @RequirePermissions('meals:create')
  createCategory(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateMealCategoryDto,
  ) {
    return this.meals.createCategory(companyId, dto);
  }

  @Get(':id')
  @RequirePermissions('meals:read')
  findOne(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    return this.meals.findOne(companyId, id);
  }

  @Post()
  @RequirePermissions('meals:create')
  create(
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateMealDto,
  ) {
    return this.meals.create(companyId, dto);
  }

  @Patch(':id')
  @RequirePermissions('meals:update')
  update(
    @CurrentUser('companyId') companyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMealDto,
  ) {
    return this.meals.update(companyId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('meals:delete')
  remove(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    return this.meals.remove(companyId, id);
  }
}
