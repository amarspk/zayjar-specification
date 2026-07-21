import { BaseTenantRepository } from './BaseTenantRepository';
import { Table, prisma } from '../index';

export class TenantTableRepository extends BaseTenantRepository<Table> {
  constructor() {
    super(prisma.table);
  }
}
