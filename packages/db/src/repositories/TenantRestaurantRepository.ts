import { BaseTenantRepository } from './BaseTenantRepository';
import { Restaurant, prisma } from '../index';

export class TenantRestaurantRepository extends BaseTenantRepository<Restaurant> {
  constructor() {
    super(prisma.restaurant);
  }
}
