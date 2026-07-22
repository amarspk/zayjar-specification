import { Module } from '@nestjs/common';
import { EmailService } from './email/email.service';
import { SmsService } from './sms/sms.service';
import { DispatchService } from './dispatch/dispatch.service';

@Module({
  providers: [EmailService, SmsService, DispatchService],
  exports: [EmailService, SmsService, DispatchService],
})
export class NotificationModule {}
