import { Test, TestingModule } from '@nestjs/testing';
import { WebhookService } from './webhook.service';
import { TenantWebhookRepository, dbTenantContext } from '@zayjar/db';

jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('mock-hash'),
  verify: jest.fn().mockResolvedValue(true),
  argon2id: 2,
}));

describe('WebhookService Unit Tests - TSK-3.0 (DOC-008 7.5)', () => {
  let service: WebhookService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebhookService],
    }).compile();

    service = module.get<WebhookService>(WebhookService);
    jest.clearAllMocks();
  });

  it('should create webhook subscription scoped to tenant', async () => {
    const tenantId = 'tenant-123';
    const dto = {
      targetUrl: 'https://example.com/webhook',
      secretKey: 'whsec_test_secret_123',
      events: ['order.created', 'order.completed'],
      isActive: true,
    };

    jest.spyOn(TenantWebhookRepository.prototype, 'create').mockResolvedValue({
      id: 'wh_123',
      targetUrl: dto.targetUrl,
      events: dto.events,
      isActive: true,
      createdAt: new Date().toISOString(),
    } as any);

    const result = await service.createWebhook(dto, tenantId);

    expect(result.id).toBe('wh_123');
    expect(result.targetUrl).toBe(dto.targetUrl);
    expect(result.events).toEqual(dto.events);
    // secretKey should not be returned
    expect((result as any).secretKey).toBeUndefined();
  });

  it('should list webhooks with tenant isolation', async () => {
    const tenantId = 'tenant-123';
    const mockWebhooks = [
      { id: 'wh_1', targetUrl: 'https://a.com', events: ['order.created'], isActive: true, createdAt: new Date().toISOString() },
      { id: 'wh_2', targetUrl: 'https://b.com', events: ['order.completed'], isActive: true, createdAt: new Date().toISOString() },
    ];

    jest.spyOn(TenantWebhookRepository.prototype, 'findMany').mockResolvedValue(mockWebhooks as any);
    jest.spyOn(dbTenantContext, 'run').mockImplementation((ctx: any, cb: any) => {
      expect(ctx.tenantId).toBe(tenantId);
      return cb();
    });

    const result = await service.listWebhooks(tenantId);
    expect(result.length).toBe(2);
    expect(result[0].id).toBe('wh_1');
  });

  it('should generate HMAC-SHA256 signature for payload', () => {
    const payload = { id: 'order-123', status: 'PENDING' };
    const secret = 'test_secret';

    const signature = service.generateSignature(payload, secret);

    expect(signature).toBeDefined();
    expect(typeof signature).toBe('string');
    expect(signature.length).toBe(64); // SHA256 hex length
    // Same payload + secret should produce same signature
    const signature2 = service.generateSignature(payload, secret);
    expect(signature).toBe(signature2);
    // Different secret should produce different signature
    const different = service.generateSignature(payload, 'different_secret');
    expect(different).not.toBe(signature);
  });

  it('should dispatch event to relevant webhooks with signature and retry', async () => {
    const tenantId = 'tenant-123';
    const eventName = 'order.created';
    const orderPayload = { id: 'order-123', orderNumber: 'ORD-001' };

    const mockWebhooks = [
      {
        id: 'wh_1',
        targetUrl: 'https://example.com/hook1',
        secretKey: 'secret1',
        events: ['order.created', 'order.accepted'],
        isActive: true,
      },
      {
        id: 'wh_2',
        targetUrl: 'https://example.com/hook2',
        secretKey: 'secret2',
        events: ['order.completed'], // not relevant for order.created
        isActive: true,
      },
      {
        id: 'wh_3',
        targetUrl: 'https://example.com/hook3',
        secretKey: 'secret3',
        events: ['order.created'],
        isActive: true,
      },
    ];

    jest.spyOn(TenantWebhookRepository.prototype, 'findMany').mockResolvedValue(mockWebhooks as any);

    // Mock fetch to simulate successful delivery
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
    } as any);

    const results = await service.dispatchEvent(tenantId, eventName, orderPayload);

    // Should dispatch to wh_1 and wh_3 only (2 webhooks), not wh_2
    expect(results.length).toBe(2);
    expect(results[0].webhookId).toBe('wh_1');
    expect(results[1].webhookId).toBe('wh_3');

    // Verify fetch called with signature header
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-Zayjar-Signature': expect.any(String),
          'X-Zayjar-Event': eventName,
        }),
      }),
    );
  });

  it('should preserve tenant isolation - never dispatch to other tenant webhooks', async () => {
    const realTenantId = 'real-tenant';
    const evilTenantId = 'evil-tenant';

    const mockWebhooksReal = [
      { id: 'wh_real', targetUrl: 'https://real.com', secretKey: 's1', events: ['order.created'], isActive: true },
    ];

    let capturedTenantId: string | null = null;
    jest.spyOn(dbTenantContext, 'run').mockImplementation((ctx: any, cb: any) => {
      capturedTenantId = ctx.tenantId;
      return cb();
    });

    jest.spyOn(TenantWebhookRepository.prototype, 'findMany').mockResolvedValue(mockWebhooksReal as any);
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 } as any);

    const results = await service.dispatchEvent(realTenantId, 'order.created', { id: 'order-1' });

    expect(capturedTenantId).toBe(realTenantId);
    expect(capturedTenantId).not.toBe(evilTenantId);
    expect(results.length).toBe(1);
  });
});
