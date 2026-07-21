import { Test, TestingModule } from '@nestjs/testing';
import { TenantContextMiddleware } from './tenant-context.middleware';
import { CacheService } from '../cache/cache.service';
import { NotFoundException } from '@nestjs/common';

describe('TenantContextMiddleware Unit Tests', () => {
  let middleware: TenantContextMiddleware;

  const mockCacheService = {
    get: jest.fn().mockImplementation((_key, fetchFn) => fetchFn()),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantContextMiddleware,
        { provide: CacheService, useValue: mockCacheService },
      ],
    }).compile();

    middleware = module.get<TenantContextMiddleware>(TenantContextMiddleware);
    jest.clearAllMocks();
  });

  it('should resolve tenant ID directly if override header is provided', async () => {
    const req = {
      headers: {
        'x-tenant-id': 'tenant-uuid-1234',
        host: 'localhost',
      },
    } as any;
    const res = {} as any;
    const next = jest.fn();

    // Act
    await middleware.use(req, res, next);

    // Assert
    expect(req['tenantId']).toBe('tenant-uuid-1234');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should reject requests with 404 if subdomain is unmapped', async () => {
    const req = {
      headers: {
        host: 'invalid.localhost',
      },
    } as any;
    const res = {} as any;
    const next = jest.fn();

    // Act & Assert
    await expect(middleware.use(req, res, next)).rejects.toThrow(NotFoundException);
    expect(next).not.toHaveBeenCalled();
  });
});
