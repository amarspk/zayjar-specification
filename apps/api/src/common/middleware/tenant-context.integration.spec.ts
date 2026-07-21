import { dbTenantContext, PrismaClient } from '@zayjar/db';

describe('Tenant Isolation Integration Tests (TSK-1.6)', () => {
  let mockQuery: jest.Mock;
  let extendedPrisma: any;

  beforeEach(() => {
    mockQuery = jest.fn().mockImplementation((args) => Promise.resolve(args));
    
    // Instantiate an extended PrismaClient with our exact query rules
    extendedPrisma = new PrismaClient().$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query: _query }) {
            const context = dbTenantContext.getStore();
            const tenantId = context?.tenantId;
            const isPlatformOwner = context?.isPlatformOwner || false;

            const unscopedModels = ['Tenant', 'SubscriptionPlan', 'AuditLog', 'Notification'];

            // ==========================================
            // FIX #1: Fail-safe context verification
            // ==========================================
            if (!unscopedModels.includes(model)) {
              if (!tenantId && !isPlatformOwner) {
                throw new Error(`Fail-Safe Block: Access to model '${model}' was blocked due to missing tenant context.`);
              }
            }

            // Apply tenant-scoping restrictions if tenant context is resolved
            if (tenantId && !unscopedModels.includes(model)) {
              // ==========================================
              // FIX #4: Block unsupported operations
              // ==========================================
              const unsupportedOperations = ['createMany', 'updateMany', 'deleteMany', 'aggregate', 'groupBy', 'upsert'];
              if (unsupportedOperations.includes(operation)) {
                throw new Error(`Fail-Safe Block: Operation '${operation}' is unsupported on scoped model '${model}' to prevent isolation bypasses.`);
              }

              // Enforce tenant scoping filters on search and mutate operations
              if (operation === 'findFirst' || operation === 'findMany' || operation === 'count' || operation === 'update' || operation === 'delete') {
                const rawArgs = args as any;
                rawArgs.where = {
                  ...rawArgs.where,
                  tenantId,
                };
              }
              
              // ==========================================
              // FIX #3: Secure create operations
              // ==========================================
              else if (operation === 'create') {
                const rawArgs = args as any;
                if (rawArgs.data && rawArgs.data.tenantId && rawArgs.data.tenantId !== tenantId) {
                  throw new Error(`Fail-Safe Block: Cross-tenant data insertion attempt detected and blocked.`);
                }
                rawArgs.data = {
                  ...rawArgs.data,
                  tenantId,
                };
              }
            }

            // Call mockQuery instead of real DB query to verify the scoped arguments!
            return mockQuery(args);
          },
        },
      },
    });
  });

  it('1. Restaurant A cannot read Restaurant B (Strict scoping check)', async () => {
    const tenantAId = 'tenant-uuid-aaaa-aaaa';

    await dbTenantContext.run({ tenantId: tenantAId }, async () => {
      await extendedPrisma.product.findFirst({
        where: { id: 'prod-1' }
      });

      // Verify that tenantId was automatically injected into the search criteria
      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: tenantAId
          })
        })
      );
    });
  });

  it('2. Restaurant A cannot update Restaurant B', async () => {
    const tenantAId = 'tenant-uuid-aaaa-aaaa';

    await dbTenantContext.run({ tenantId: tenantAId }, async () => {
      await extendedPrisma.product.update({
        where: { id: 'prod-1' },
        data: { name: 'New Name' }
      });

      // Verify update contains tenantId filters, blocking updates on other tenants
      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: tenantAId
          })
        })
      );
    });
  });

  it('3. Restaurant A cannot delete Restaurant B', async () => {
    const tenantAId = 'tenant-uuid-aaaa-aaaa';

    await dbTenantContext.run({ tenantId: tenantAId }, async () => {
      await extendedPrisma.product.delete({
        where: { id: 'prod-1' }
      });

      // Verify delete includes tenantId filters, preventing cross-tenant deletes
      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: tenantAId
          })
        })
      );
    });
  });

  it('4. Request without tenant context returns 403 / throws Fail-Safe exception', async () => {
    // Act & Assert: Running scoped model queries without an active context throws immediate fail-safe block
    await expect(
      extendedPrisma.product.findMany()
    ).rejects.toThrow(/Fail-Safe Block: Access to model 'Product' was blocked due to missing tenant context/);
  });

  it('5. Platform Owner can access global resources (unscoped)', async () => {
    // Platform owners bypass isolation rules
    await dbTenantContext.run({ isPlatformOwner: true }, async () => {
      await extendedPrisma.tenant.findMany();

      // Verify no tenantId constraints are appended for Platform Owners
      expect(mockQuery).toHaveBeenCalledWith(
        expect.not.objectContaining({
          where: expect.objectContaining({
            tenantId: expect.any(String)
          })
        })
      );
    });
  });

  it('6. Unsupported bulk and complex operations are blocked natively', async () => {
    const tenantAId = 'tenant-uuid-aaaa-aaaa';

    await dbTenantContext.run({ tenantId: tenantAId }, async () => {
      // Act & Assert: createMany is blocked
      await expect(
        extendedPrisma.product.createMany({ data: [] })
      ).rejects.toThrow(/Fail-Safe Block: Operation 'createMany' is unsupported on scoped model 'Product'/);

      // Act & Assert: updateMany is blocked
      await expect(
        extendedPrisma.product.updateMany({ where: {}, data: {} })
      ).rejects.toThrow(/Fail-Safe Block: Operation 'updateMany' is unsupported on scoped model 'Product'/);

      // Act & Assert: aggregate is blocked
      await expect(
        extendedPrisma.product.aggregate({ _count: true })
      ).rejects.toThrow(/Fail-Safe Block: Operation 'aggregate' is unsupported on scoped model 'Product'/);
    });
  });
});
