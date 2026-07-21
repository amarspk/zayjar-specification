import { dbTenantContext, TenantProductRepository, prisma } from '@zayjar/db';

describe('BaseTenantRepository & TenantProductRepository Unit Tests', () => {
  let repository: TenantProductRepository;

  beforeEach(() => {
    repository = new TenantProductRepository();
    jest.restoreAllMocks();
  });

  it('1. tenantId is injected automatically inside repository queries', async () => {
    const tenantId = 'tenant-uuid-1111';
    
    // Spy on the Prisma findFirst model method
    const findFirstSpy = jest.spyOn(prisma.product, 'findFirst')
      .mockResolvedValue({ id: 'prod-1', tenantId } as any);

    await dbTenantContext.run({ tenantId }, async () => {
      // Act
      await repository.findById('prod-1');

      // Assert
      expect(findFirstSpy).toHaveBeenCalledWith({
        where: { id: 'prod-1', tenantId },
      });
    });
  });

  it('2. missing tenant context throws Fail-Safe exception immediately', async () => {
    // Act & Assert: Invoking findById outside dbTenantContext storage throws immediately
    await expect(
      repository.findById('prod-1')
    ).rejects.toThrow(/Fail-Safe Block: Access denied due to missing or unresolved tenant context/);
  });

  it('3. cross-tenant access is impossible during inserts', async () => {
    const tenantId = 'tenant-uuid-1111';

    await dbTenantContext.run({ tenantId }, async () => {
      // Act & Assert: Injecting a forged tenantId ('tenant-uuid-2222') throws fail-safe
      await expect(
        repository.create({ name: 'Forged Product', tenantId: 'tenant-uuid-2222' })
      ).rejects.toThrow(/Fail-Safe Block: Cross-tenant data insertion attempt detected and blocked/);
    });
  });

  it('4. repository methods produce identical behavior to previous findFirst filters', async () => {
    const tenantId = 'tenant-uuid-1111';
    const findFirstSpy = jest.spyOn(prisma.product, 'findFirst')
      .mockResolvedValue({ id: 'prod-1', tenantId } as any);

    await dbTenantContext.run({ tenantId }, async () => {
      // Act
      await repository.findById('prod-1');

      // Assert: Verify it produces exactly: findFirst({ where: { id: 'prod-1', tenantId } })
      expect(findFirstSpy).toHaveBeenCalledWith({
        where: { id: 'prod-1', tenantId },
      });
    });
  });
});
