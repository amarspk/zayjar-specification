import { BaseTenantRepository } from './BaseTenantRepository';
import { Category, prisma } from '../index';

export class TenantCategoryRepository extends BaseTenantRepository<Category> {
  constructor() {
    super(prisma.category);
  }
}
