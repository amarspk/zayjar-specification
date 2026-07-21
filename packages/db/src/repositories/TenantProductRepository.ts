import { BaseTenantRepository } from './BaseTenantRepository';
import { Product, prisma } from '../index';

export class TenantProductRepository extends BaseTenantRepository<Product> {
  constructor() {
    super(prisma.product);
  }
}
