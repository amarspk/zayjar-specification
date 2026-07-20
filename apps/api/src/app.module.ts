import { Module } from '@nestjs/common';
import { CacheModule } from './common/cache/cache.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [CacheModule, AuthModule],
})
export class AppModule {}
