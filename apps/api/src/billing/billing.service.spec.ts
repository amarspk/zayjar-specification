import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { prisma } from '@zayjar/db';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('mock-hash'),
  verify: jest.fn().mockResolvedValue(true),
  argon2id: 2,
}));

describe('BillingService Unit Tests - TSK-2.4', () => {
  let service: BillingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BillingService],
    }).compile();

    service = module.get<BillingService>(BillingService);
    jest.clearAllMocks();
    delete process.env.STRIPE_SECRET_KEY;
  });

  it('should create mock checkout session when STRIPE_SECRET_KEY not configured', async () => {
    const tenantId = 'tenant-123';
    const userId = 'user-123';
    const planId = 'plan-gold';
    const dto = {
      planId,
      successUrl: 'https://gourmet-burgers.zayjar.com/backoffice/settings/billing?status=success',
      cancelUrl: 'https://gourmet-burgers.zayjar.com/backoffice/settings/billing?status=canceled',
    };

    jest.spyOn(prisma.subscriptionPlan, 'findUnique').mockResolvedValue({
      id: planId,
      stripePriceId: 'price_123',
    } as any);

    jest.spyOn(prisma.tenant, 'findUnique').mockResolvedValue({
      id: tenantId,
      stripeCustomerId: null,
    } as any);

    const result = await service.createCheckoutSession(dto, tenantId, userId);

    expect(result.checkoutSessionId).toBeDefined();
    expect(result.checkoutSessionId).toContain('cs_test_');
    expect(result.stripeCheckoutUrl).toContain('https://checkout.stripe.com/c/pay/');
  });

  it('should throw NotFoundException if plan not found', async () => {
    const tenantId = 'tenant-123';
    const userId = 'user-123';
    const dto = {
      planId: 'invalid-plan',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    };

    jest.spyOn(prisma.subscriptionPlan, 'findUnique').mockResolvedValue(null);

    await expect(service.createCheckoutSession(dto, tenantId, userId)).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException if tenant not found', async () => {
    const tenantId = 'tenant-missing';
    const userId = 'user-123';
    const dto = {
      planId: 'plan-gold',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    };

    jest.spyOn(prisma.subscriptionPlan, 'findUnique').mockResolvedValue({
      id: dto.planId,
      stripePriceId: 'price_123',
    } as any);

    jest.spyOn(prisma.tenant, 'findUnique').mockResolvedValue(null);

    await expect(service.createCheckoutSession(dto, tenantId, userId)).rejects.toThrow(NotFoundException);
  });

  it('should preserve tenant isolation by validating tenant existence', async () => {
    const tenantId = 'real-tenant-from-jwt';
    const userId = 'user-1';
    const dto = {
      planId: 'plan-1',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    };

    const planSpy = jest.spyOn(prisma.subscriptionPlan, 'findUnique').mockResolvedValue({
      id: 'plan-1',
      stripePriceId: 'price_123',
    } as any);

    const tenantSpy = jest.spyOn(prisma.tenant, 'findUnique').mockResolvedValue({
      id: tenantId,
    } as any);

    const result = await service.createCheckoutSession(dto, tenantId, userId);

    expect(planSpy).toHaveBeenCalledWith({ where: { id: dto.planId } });
    expect(tenantSpy).toHaveBeenCalledWith({ where: { id: tenantId } });
    expect(result.checkoutSessionId).toBeDefined();
  });
});
