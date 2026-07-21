import { BaseTenantRepository } from './BaseTenantRepository';
import { ProductAddon, prisma } from '../index';

export class TenantProductAddonRepository extends BaseTenantRepository<ProductAddon> {
  constructor() {
    super(prisma.productAddon);
  }
}
