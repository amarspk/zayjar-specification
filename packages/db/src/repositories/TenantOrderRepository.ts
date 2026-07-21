import { BaseTenantRepository } from './BaseTenantRepository';
import { Order, prisma } from '../index';

export class TenantOrderRepository extends BaseTenantRepository<Order> {
  constructor() {
    super(prisma.order);
  }
}
