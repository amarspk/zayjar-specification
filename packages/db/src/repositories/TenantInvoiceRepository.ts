import { BaseTenantRepository } from './BaseTenantRepository';
import { Invoice, prisma } from '../index';

export class TenantInvoiceRepository extends BaseTenantRepository<Invoice> {
  constructor() {
    super(prisma.invoice);
  }
}
