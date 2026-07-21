import { Module } from '@nestjs/common';
import { DeviceTokenService } from './device-token.service';
import { DeviceTokenController } from './device-token.controller';

@Module({
  controllers: [DeviceTokenController],
  providers: [DeviceTokenService],
  exports: [DeviceTokenService],
})
export class DeviceTokenModule {}
