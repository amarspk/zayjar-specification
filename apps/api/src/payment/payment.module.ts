import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { PaymentController } from './payment.controller';

@Module({
  controllers: [PaymentController],
  providers: [WalletService],
  exports: [WalletService],
})
export class PaymentModule {}
