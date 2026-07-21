import { BaseTenantRepository } from './BaseTenantRepository';
import { AddonItem, prisma } from '../index';

export class TenantAddonItemRepository extends BaseTenantRepository<AddonItem> {
  constructor() {
    super(prisma.addonItem);
  }
}
