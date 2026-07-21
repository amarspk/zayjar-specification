import { PrismaClient } from './generated-client';
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  tenantId?: string;
  isPlatformOwner?: boolean;
}

// Central thread-local execution context
export const dbTenantContext = new AsyncLocalStorage<TenantContext>();

export const prisma = new PrismaClient().$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const context = dbTenantContext.getStore();
        const tenantId = context?.tenantId;
        const isPlatformOwner = context?.isPlatformOwner || false;

        const unscopedModels = ['Tenant', 'SubscriptionPlan', 'AuditLog', 'Notification'];

        // ==========================================
        // 1. Fail-safe context verification
        // ==========================================
        if (!unscopedModels.includes(model)) {
          if (!tenantId && !isPlatformOwner) {
            throw new Error(`Fail-Safe Block: Access to model '${model}' was blocked due to missing tenant context.`);
          }
        }

        // Apply tenant-scoping restrictions if tenant context is resolved
        if (tenantId && !unscopedModels.includes(model)) {
          // ==========================================
          // 2. Block unsupported operations
          // ==========================================
          const unsupportedOperations = ['createMany', 'updateMany', 'deleteMany', 'aggregate', 'groupBy', 'upsert'];
          if (unsupportedOperations.includes(operation)) {
            throw new Error(`Fail-Safe Block: Operation '${operation}' is unsupported on scoped model '${model}' to prevent isolation bypasses.`);
          }

          // ==========================================
          // 3. Enforce tenant scoping filters on standard operations (no rerouting/recursion)
          // ==========================================
          if (operation === 'findFirst' || operation === 'findMany' || operation === 'count' || operation === 'update' || operation === 'delete') {
            const rawArgs = args as any;
            rawArgs.where = {
              ...rawArgs.where,
              tenantId,
            };
          }
          
          // ==========================================
          // 4. Secure create operations
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

        // Standard direct execution path (No operation reassignments or delegate re-entry)
        return query(args);
      },
    },
  },
}) as any;

export * from './generated-client';
export * from './repositories';
export const dbPlaceholder = "zayjar-db";
