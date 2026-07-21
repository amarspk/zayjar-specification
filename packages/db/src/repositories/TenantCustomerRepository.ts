import { BaseTenantRepository } from './BaseTenantRepository';
import { Customer, prisma } from '../index';

export class TenantCustomerRepository extends BaseTenantRepository<Customer> {
  constructor() {
    super(prisma.customer);
  }
}
