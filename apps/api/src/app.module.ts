import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EmployeesModule } from './employees/employees.module';
import { MealsModule } from './meals/meals.module';
import { MealSchedulesModule } from './meal-schedules/meal-schedules.module';
import { BookingsModule } from './bookings/bookings.module';
import { KitchenModule } from './kitchen/kitchen.module';
import { PosModule } from './pos/pos.module';
import { InventoryModule } from './inventory/inventory.module';
import { WalletModule } from './wallet/wallet.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { PromotionsModule } from './promotions/promotions.module';
import { AuditModule } from './audit/audit.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      },
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    UsersModule,
    EmployeesModule,
    MealsModule,
    MealSchedulesModule,
    BookingsModule,
    KitchenModule,
    PosModule,
    InventoryModule,
    WalletModule,
    LoyaltyModule,
    NotificationsModule,
    AnalyticsModule,
    SuppliersModule,
    PromotionsModule,
    AuditModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule {}
