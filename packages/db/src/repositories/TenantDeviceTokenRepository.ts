import { BaseTenantRepository } from './BaseTenantRepository';
import { DeviceToken, prisma } from '../index';

export class TenantDeviceTokenRepository extends BaseTenantRepository<DeviceToken> {
  constructor() {
    super(prisma.deviceToken);
  }
}
