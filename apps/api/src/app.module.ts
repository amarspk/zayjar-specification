import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { CacheModule } from './common/cache/cache.module';
import { AuthModule } from './auth/auth.module';
import { TenantModule } from './tenant/tenant.module';
import { BranchModule } from './branch/branch.module';
import { MenuModule } from './menu/menu.module';
import { OrderModule } from './order/order.module';
import { KdsModule } from './kds/kds.module';
import { CustomerModule } from './customer/customer.module';
import { BillingModule } from './billing/billing.module';
import { AdminModule } from './admin/admin.module';
import { AssetModule } from './asset/asset.module';
import { WebhookModule } from './webhook/webhook.module';
import { DeviceTokenModule } from './device-token/device-token.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { TenantContextMiddleware } from './common/middleware/tenant-context.middleware';

@Module({
  imports: [CacheModule, AuthModule, TenantModule, BranchModule, MenuModule, OrderModule, KdsModule, CustomerModule, BillingModule, AdminModule, AssetModule, WebhookModule, DeviceTokenModule, SubscriptionModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantContextMiddleware)
      .forRoutes('*'); // Apply tenant scoping globally across all API paths
  }
}
