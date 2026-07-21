import { BaseTenantRepository } from './BaseTenantRepository';
import { OrderItem, prisma } from '../index';

export class TenantOrderItemRepository extends BaseTenantRepository<OrderItem> {
  constructor() {
    super(prisma.orderItem);
  }
}
