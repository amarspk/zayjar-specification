import { BaseTenantRepository } from './BaseTenantRepository';
import { ProductSize, prisma } from '../index';

export class TenantProductSizeRepository extends BaseTenantRepository<ProductSize> {
  constructor() {
    super(prisma.productSize);
  }
}
