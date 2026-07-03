import { Module } from '@nestjs/common';
import { PosController } from './pos.controller';
import { PosService } from './pos.service';
import { WalletModule } from '../wallet/wallet.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';

@Module({
  imports: [WalletModule, LoyaltyModule],
  controllers: [PosController],
  providers: [PosService],
  exports: [PosService],
})
export class PosModule {}
