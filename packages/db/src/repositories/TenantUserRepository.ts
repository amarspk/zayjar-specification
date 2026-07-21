import { BaseTenantRepository } from './BaseTenantRepository';
import { User, prisma } from '../index';

export class TenantUserRepository extends BaseTenantRepository<User> {
  constructor() {
    super(prisma.user);
  }
}
