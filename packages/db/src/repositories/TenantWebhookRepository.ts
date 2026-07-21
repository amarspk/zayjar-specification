import { BaseTenantRepository } from './BaseTenantRepository';
import { Webhook, prisma } from '../index';

export class TenantWebhookRepository extends BaseTenantRepository<Webhook> {
  constructor() {
    super(prisma.webhook);
  }
}
