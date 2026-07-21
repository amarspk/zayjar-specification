import { Module } from '@nestjs/common';
import { KdsGateway } from './kds.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [KdsGateway],
  exports: [KdsGateway],
})
export class KdsModule {}
