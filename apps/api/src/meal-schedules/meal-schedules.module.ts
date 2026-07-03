import { Module } from '@nestjs/common';
import { MealSchedulesController } from './meal-schedules.controller';
import { MealSchedulesService } from './meal-schedules.service';

@Module({
  controllers: [MealSchedulesController],
  providers: [MealSchedulesService],
  exports: [MealSchedulesService],
})
export class MealSchedulesModule {}
