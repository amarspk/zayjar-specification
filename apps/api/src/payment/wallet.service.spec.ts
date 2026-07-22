import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { TenantOrderRepository, dbTenantContext } from '@zayjar/db';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PaymentMethodType } from '@zayjar/types';

jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('mock-hash'),
  verify: jest.fn().mockResolvedValue(true),
  argon2id: 2,
}));

describe('WalletService Unit Tests - DOC-009 8.3 Regional Wallets', () => {
  let service: WalletService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WalletService],
    }).compile();

    service = module.get<WalletService>(WalletService);
    jest.clearAllMocks();
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.TAP_PAYMENTS_SECRET_KEY;
  });

  it('should create Apple Pay payment via Stripe mock', async () => {
    const tenantId = 'tenant-123';
    const userId = 'user-123';
    const dto = {
      orderId: 'order-123',
      paymentMethod: PaymentMethodType.APPLE_PAY,
      walletType: 'apple_pay',
      amount: 25.5,
      currency: 'USD',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    };

    jest.spyOn(TenantOrderRepository.prototype, 'findById').mockResolvedValue({
      id: dto.orderId,
      tenantId,
      total: 25.5,
    } as any);

    jest.spyOn(dbTenantContext, 'run').mockImplementation((ctx: any, cb: any) => cb());

    const result = await service.createWalletPayment(dto as any, tenantId, userId);

    expect(result.paymentId).toContain('apple_pay');
    expect(result.walletType).toBe('apple_pay');
    expect(result.provider).toContain('stripe');
    expect(result.amount).toBe(dto.amount);
  });

  it('should create KNET payment via Tap Payments mock', async () => {
    const tenantId = 'tenant-123';
    const userId = 'user-123';
    const dto = {
      orderId: 'order-123',
      paymentMethod: PaymentMethodType.LOCAL_WALLET,
      walletType: 'knet',
      amount: 15.0,
      currency: 'KWD',
    };

    jest.spyOn(TenantOrderRepository.prototype, 'findById').mockResolvedValue({
      id: dto.orderId,
      tenantId,
    } as any);
    jest.spyOn(dbTenantContext, 'run').mockImplementation((ctx: any, cb: any) => cb());

    const result = await service.createWalletPayment(dto as any, tenantId, userId);

    expect(result.walletType).toBe('knet');
    expect(result.provider).toContain('tap_payments');
    expect((result as any).redirectUrl).toBeDefined();
  });

  it('should create Benefit payment for Bahrain', async () => {
    const tenantId = 'tenant-123';
    const userId = 'user-123';
    const dto = {
      orderId: 'order-123',
      paymentMethod: PaymentMethodType.LOCAL_WALLET,
      walletType: 'benefit',
      amount: 20,
      currency: 'BHD',
    };

    jest.spyOn(TenantOrderRepository.prototype, 'findById').mockResolvedValue({ id: dto.orderId, tenantId } as any);
    jest.spyOn(dbTenantContext, 'run').mockImplementation((ctx: any, cb: any) => cb());

    const result = await service.createWalletPayment(dto as any, tenantId, userId);

    expect(result.walletType).toBe('benefit');
    expect(result.provider).toContain('tap_payments');
  });

  it('should create Mada payment for Saudi Arabia', async () => {
    const tenantId = 'tenant-123';
    const userId = 'user-123';
    const dto = {
      orderId: 'order-123',
      paymentMethod: PaymentMethodType.LOCAL_WALLET,
      walletType: 'mada',
      amount: 30,
      currency: 'SAR',
    };

    jest.spyOn(TenantOrderRepository.prototype, 'findById').mockResolvedValue({ id: dto.orderId, tenantId } as any);
    jest.spyOn(dbTenantContext, 'run').mockImplementation((ctx: any, cb: any) => cb());

    const result = await service.createWalletPayment(dto as any, tenantId, userId);

    expect(result.walletType).toBe('mada');
  });

  it('should throw NotFoundException if order not found under tenant', async () => {
    const tenantId = 'tenant-123';
    const userId = 'user-123';
    const dto = {
      orderId: 'nonexistent',
      paymentMethod: PaymentMethodType.APPLE_PAY,
      walletType: 'apple_pay',
      amount: 10,
    };

    jest.spyOn(TenantOrderRepository.prototype, 'findById').mockResolvedValue(null);
    jest.spyOn(dbTenantContext, 'run').mockImplementation((ctx: any, cb: any) => cb());

    await expect(service.createWalletPayment(dto as any, tenantId, userId)).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException for unsupported wallet type', async () => {
    const tenantId = 'tenant-123';
    const userId = 'user-123';
    const dto = {
      orderId: 'order-123',
      paymentMethod: PaymentMethodType.LOCAL_WALLET,
      walletType: 'unsupported_wallet',
      amount: 10,
    };

    jest.spyOn(TenantOrderRepository.prototype, 'findById').mockResolvedValue({ id: dto.orderId, tenantId } as any);
    jest.spyOn(dbTenantContext, 'run').mockImplementation((ctx: any, cb: any) => cb());

    await expect(service.createWalletPayment(dto as any, tenantId, userId)).rejects.toThrow(BadRequestException);
  });

  it('should preserve tenant isolation - order must belong to tenant', async () => {
    const realTenantId = 'real-tenant';
    const evilTenantId = 'evil-tenant';
    const dto = {
      orderId: 'order-123',
      paymentMethod: PaymentMethodType.APPLE_PAY,
      walletType: 'apple_pay',
      amount: 10,
    };

    let capturedTenantId: string | null = null;
    jest.spyOn(dbTenantContext, 'run').mockImplementation((ctx: any, cb: any) => {
      capturedTenantId = ctx.tenantId;
      return cb();
    });

    jest.spyOn(TenantOrderRepository.prototype, 'findById').mockResolvedValue({ id: dto.orderId, tenantId: realTenantId } as any);

    await service.createWalletPayment(dto as any, realTenantId, 'user-1');

    expect(capturedTenantId).toBe(realTenantId);
    expect(capturedTenantId).not.toBe(evilTenantId);
  });

  it('should verify payment status', async () => {
    const tenantId = 'tenant-123';
    const paymentId = 'pi_mock_apple_pay_123';

    const result = await service.verifyPayment(paymentId, tenantId);

    expect(result.paymentId).toBe(paymentId);
    expect(result.verified).toBe(true);
    expect(result.status).toBe('succeeded');
    expect(result.tenantId).toBe(tenantId);
  });
});
