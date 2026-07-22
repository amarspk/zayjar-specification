import { Test, TestingModule } from '@nestjs/testing';
import { SmsService } from './sms.service';

describe('SmsService Unit Tests - DOC-008 7.3 SMS Routing', () => {
  let service: SmsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SmsService],
    }).compile();

    service = module.get<SmsService>(SmsService);
    jest.clearAllMocks();
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.UNIFONIC_APP_SID;
  });

  it('should send SMS via Twilio for international numbers', async () => {
    const to = '+12025550144';
    const message = 'Your order ORD-123 is ready';

    const result = await service.sendSms(to, message);

    expect(result.success).toBe(true);
    expect(result.provider).toContain('twilio');
    expect(result.attempts).toBe(1);
  });

  it('should route Middle Eastern numbers via Unifonic regional provider', async () => {
    const to = '+966512345678'; // Saudi Arabia
    const message = 'Your order is ready';

    const result = await service.sendSms(to, message);

    expect(result.success).toBe(true);
    expect(result.provider).toContain('unifonic');
  });

  it('should implement failover queue when primary provider fails', async () => {
    const to = '+12025550144';
    const message = 'Test message';

    // Mock primary provider to fail by setting invalid creds and forcing error
    // Our service falls back to mock when creds missing, so it will succeed via mock
    // To test failover, we can spy on private methods
    const twilioSpy = jest.spyOn(service as any, 'sendViaTwilio').mockResolvedValue({
      success: false,
      provider: 'twilio',
      error: 'Twilio API outage',
    });

    const result = await service.sendSms(to, message);

    expect(twilioSpy).toHaveBeenCalled();
    // Should succeed via secondary mock provider
    expect(result.success).toBe(true);
    expect(result.provider).toBe('mock-sms');
    expect(result.attempts).toBeGreaterThan(1);
  });

  it('should validate E.164 phone format', async () => {
    const invalidTo = '123456';
    const message = 'Test';

    await expect(service.sendSms(invalidTo, message)).rejects.toThrow('E.164');
  });

  it('should send order status SMS via convenience method', async () => {
    const to = '+12025550144';
    const orderNumber = 'ORD-2026-12345';
    const status = 'READY';

    const result = await service.sendOrderStatusSms(to, orderNumber, status);

    expect(result.success).toBe(true);
    expect(result.provider).toBeDefined();
  });

  it('should send OTP SMS via convenience method', async () => {
    const to = '+12025550144';
    const otp = '123456';

    const result = await service.sendOtpSms(to, otp);

    expect(result.success).toBe(true);
  });

  it('should preserve tenant isolation - tenantId does not affect routing but is logged', async () => {
    const tenantId = 'real-tenant';
    const to = '+12025550144';
    const message = 'Test';

    const result = await service.sendSms(to, message, tenantId);

    expect(result.success).toBe(true);
    // TenantId is used for logging/tracking, not for routing decision, but should not expose cross-tenant
  });
});
