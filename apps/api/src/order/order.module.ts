import { Module, forwardRef } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { AuthModule } from '../auth/auth.module';
import { KdsModule } from '../kds/kds.module';
import { WebhookModule } from '../webhook/webhook.module';

@Module({
  imports: [AuthModule, forwardRef(() => KdsModule), forwardRef(() => WebhookModule)],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
