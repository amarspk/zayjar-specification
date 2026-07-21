import { Test, TestingModule } from '@nestjs/testing';
import { TenantService } from './tenant.service';
import { AuthService } from '../auth/auth.service';
import { prisma } from '@zayjar/db';

// Mocking argon2 C++ native modules to prevent Jest V8 multithreaded segmentation faults
jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('mock-argon2-hash'),
  verify: jest.fn().mockResolvedValue(true),
  argon2id: 2,
}));

describe('TenantService Unit Tests', () => {
  let service: TenantService;

  const mockAuthService = {
    hashPassword: jest.fn().mockResolvedValue('mock-argon2-hash'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
  });

  it('should successfully orchestrate tenant onboarding inside transaction', async () => {
    // Mock the dynamic transaction mapper on prisma
    const txMock = {
      tenant: { create: jest.fn().mockResolvedValue({ id: 't1', name: 'Gourmet', subdomain: 'gourmet', status: 'TRIALING' }) },
      subscription: { create: jest.fn().mockResolvedValue({}) },
      user: { create: jest.fn().mockResolvedValue({ id: 'u1', email: 'owner@gourmet.com' }) },
      role: { create: jest.fn().mockResolvedValue({ id: 'r1' }) },
      userRole: { create: jest.fn().mockResolvedValue({}) },
      restaurant: { create: jest.fn().mockResolvedValue({ id: 'rest1' }) },
      branch: { create: jest.fn().mockResolvedValue({ id: 'b1', name: 'Main Branch' }) },
    };

    jest.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => cb(txMock));
    jest.spyOn(prisma.tenant, 'findUnique').mockResolvedValue(null);

    const dto = {
      companyName: 'Gourmet',
      subdomain: 'gourmet',
      ownerFirstName: 'John',
      ownerLastName: 'Doe',
      ownerEmail: 'owner@gourmet.com',
      ownerPassword: 'Password123!',
      planId: 'plan1',
    };

    const result = await service.onboard(dto);

    expect(result.tenant.id).toBe('t1');
    expect(result.owner.id).toBe('u1');
    expect(result.branch.id).toBe('b1');
    expect(mockAuthService.hashPassword).toHaveBeenCalledWith('Password123!');
  });
});
