import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { prisma } from '@zayjar/db';

jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('mock-hash'),
  verify: jest.fn().mockResolvedValue(true),
  argon2id: 2,
}));

describe('AdminService Unit Tests - TSK-2.6', () => {
  let service: AdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminService],
    }).compile();

    service = module.get<AdminService>(AdminService);
    jest.clearAllMocks();
  });

  it('should return tenant metrics with counts and financials', async () => {
    jest.spyOn(prisma.tenant, 'count').mockResolvedValue(142 as any);
    jest.spyOn(prisma.subscription, 'count').mockResolvedValue(120 as any);
    jest.spyOn(prisma.subscription, 'findMany').mockResolvedValue([
      { plan: { priceMonthly: 100 } },
      { plan: { priceMonthly: 50 } },
      { plan: { priceMonthly: 75 } },
    ] as any);
    jest.spyOn(prisma, '$queryRaw').mockResolvedValue([{ count: 18 }] as any);

    const result = await service.getTenantsMetrics();

    expect(result.totalTenants).toBe(142);
    expect(result.activeSubscriptions).toBe(120);
    expect(result.mrrUSD).toBe(225); // 100+50+75
    expect(result.arrUSD).toBe(2700); // 225*12
    expect(result.systemLoadAverage).toBeDefined();
    expect(result.databaseConnectionsCount).toBe(18);
  });

  it('should fallback database connections count when query fails', async () => {
    jest.spyOn(prisma.tenant, 'count').mockResolvedValue(10 as any);
    jest.spyOn(prisma.subscription, 'count').mockResolvedValue(5 as any);
    jest.spyOn(prisma.subscription, 'findMany').mockResolvedValue([
      { plan: { priceMonthly: 100 } },
    ] as any);
    jest.spyOn(prisma, '$queryRaw').mockRejectedValue(new Error('DB not available'));

    const result = await service.getTenantsMetrics();

    expect(result.totalTenants).toBe(10);
    expect(result.activeSubscriptions).toBe(5);
    expect(result.mrrUSD).toBe(100);
    expect(result.databaseConnectionsCount).toBeDefined();
    expect(result.databaseConnectionsCount).toBeGreaterThan(0);
  });

  it('should calculate MRR and ARR correctly with rounding', async () => {
    jest.spyOn(prisma.tenant, 'count').mockResolvedValue(2 as any);
    jest.spyOn(prisma.subscription, 'count').mockResolvedValue(2 as any);
    jest.spyOn(prisma.subscription, 'findMany').mockResolvedValue([
      { plan: { priceMonthly: 99.99 } },
      { plan: { priceMonthly: 0.01 } },
    ] as any);
    jest.spyOn(prisma, '$queryRaw').mockResolvedValue([{ count: 5 }] as any);

    const result = await service.getTenantsMetrics();

    expect(result.mrrUSD).toBe(100.0);
    expect(result.arrUSD).toBe(1200.0);
  });
});
