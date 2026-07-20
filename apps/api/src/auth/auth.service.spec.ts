import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { CacheService } from '../common/cache/cache.service';

// Mocking argon2 C++ native modules to prevent Jest V8 multithreaded segmentation faults
jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('mock-hashed-password'),
  verify: jest.fn().mockResolvedValue(true),
  argon2id: 2,
}));

describe('AuthService Unit Tests', () => {
  let service: AuthService;

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('mock-token'),
    verifyAsync: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: CacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should successfully hash and verify passwords using mock wrapper', async () => {
    const password = 'SuperSecurePassword123!';
    const hash = await service.hashPassword(password);

    expect(hash).toBe('mock-hashed-password');

    const isValid = await service.comparePassword(password, hash);
    expect(isValid).toBe(true);
  });

  it('should generate JWT tokens successfully', async () => {
    const payload = {
      sub: 'u1',
      email: 'user@zayjar.com',
      tenantId: 't1',
      roles: ['CASHIER'],
      permissions: ['orders:create'],
    };

    const tokens = await service.generateTokens(payload);
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
  });
});
