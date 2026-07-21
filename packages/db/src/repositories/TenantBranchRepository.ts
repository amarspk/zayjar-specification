import { BaseTenantRepository } from './BaseTenantRepository';
import { Branch, prisma } from '../index';

export class TenantBranchRepository extends BaseTenantRepository<Branch> {
  constructor() {
    super(prisma.branch);
  }
}
