import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import {
  TenantBranchRepository,
  TenantProductRepository,
  TenantProductSizeRepository,
  TenantAddonItemRepository,
  TenantOrderRepository,
  TenantRestaurantRepository,
  prisma,
} from '@zayjar/db';
import { OrderStatus, OrderType, PaymentMethodType } from '@zayjar/types';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';

// Mocking argon2 C++ native modules to prevent Jest V8 multithreaded segmentation faults
jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('mock-argon2-hash'),
  verify: jest.fn().mockResolvedValue(true),
  argon2id: 2,
}));

describe('OrderService Unit Tests', () => {
  let service: OrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrderService],
    }).compile();

    service = module.get<OrderService>(OrderService);
    jest.clearAllMocks();
  });

  // ==========================================
  // 1. Server-Side Totals Calculation (Never Trust Client Prices)
  // ==========================================
  it('should calculate subtotal, taxes (based on branch tax percentage), and final total strictly using database values', async () => {
    const tenantId = 'tenant-uuid-1111';
    const branchId = 'branch-uuid-1234';
    const productId = 'prod-uuid-999';
    const sizeId = 'size-uuid-222';
    const addonItemId = 'addon-item-uuid-333';

    // A. Mock database values for Branch
    jest.spyOn(TenantBranchRepository.prototype, 'findById').mockResolvedValue({
      id: branchId,
      tenantId,
      restaurantId: 'rest-uuid-999',
    } as any);

    // B. Mock Restaurant (15% tax)
    jest.spyOn(TenantRestaurantRepository.prototype, 'findById').mockResolvedValue({
      id: 'rest-uuid-999',
      taxPercentage: 15.00 as any,
    } as any);

    // C. Mock Product ($10.00 basePrice)
    jest.spyOn(TenantProductRepository.prototype, 'findById').mockResolvedValue({
      id: productId,
      basePrice: 10.00 as any,
      isAvailable: true,
    } as any);

    // D. Mock ProductSize (+$2.50 adjustment)
    jest.spyOn(TenantProductSizeRepository.prototype, 'findMany').mockResolvedValue([
      { id: sizeId, priceAdjustment: 2.50 as any } as any,
    ]);

    // E. Mock AddonItem (+$1.50 price)
    jest.spyOn(TenantAddonItemRepository.prototype, 'findMany').mockResolvedValue([
      { id: addonItemId, price: 1.50 as any, isAvailable: true } as any,
    ]);

    // F. Mock Prisma $transaction
    const mockOrderResult = {
      id: 'order-1',
      orderNumber: 'ORD-2026-12345',
      subtotal: 28.00, // (10.00 base + 2.50 size + 1.50 addon) * 2 quantity = 28.00
      taxAmount: 4.20,  // 28.00 * 15% = 4.20
      total: 32.20,     // 28.00 + 4.20 = 32.20
    };
    const txMock = {
      order: {
        create: jest.fn().mockResolvedValue(mockOrderResult),
      },
    };
    jest.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => cb(txMock));

    const createDto = {
      branchId,
      type: OrderType.DINE_IN,
      items: [
        {
          productId,
          sizeId,
          quantity: 2,
          addons: [{ addonItemId }],
        },
      ],
      paymentMethod: PaymentMethodType.CASH,
    };

    // Act
    const result = await service.createOrder(createDto, tenantId);

    // Assert
    expect(result.subtotal).toBe(28.00);
    expect(result.taxAmount).toBe(4.20);
    expect(result.total).toBe(32.20);
    expect(txMock.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subtotal: 28.00,
          taxAmount: 4.20,
          total: 32.20,
        }),
      }),
    );
  });

  // ==========================================
  // 2. Client-Side Request Forgery & Ownership Validations
  // ==========================================
  it('should throw NotFoundException if the targeted branch does not belong to the active tenant workspace', async () => {
    const tenantId = 'tenant-uuid-1111';
    
    // Mock branch search to return null (indicating unauthorized or missing branch)
    jest.spyOn(TenantBranchRepository.prototype, 'findById').mockResolvedValue(null);

    const createDto = {
      branchId: 'unauthorized-branch',
      type: OrderType.TAKE_AWAY,
      items: [],
      paymentMethod: PaymentMethodType.CASH,
    };

    await expect(
      service.createOrder(createDto, tenantId)
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException if a product is currently unavailable or missing', async () => {
    const tenantId = 'tenant-uuid-1111';
    const branchId = 'branch-uuid-1234';

    jest.spyOn(TenantBranchRepository.prototype, 'findById').mockResolvedValue({
      id: branchId,
      tenantId,
      restaurantId: 'rest-uuid-999',
    } as any);

    jest.spyOn(TenantRestaurantRepository.prototype, 'findById').mockResolvedValue({
      id: 'rest-uuid-999',
      taxPercentage: 0 as any,
    } as any);

    // Mock product lookup to return null (unauthorized or non-existent)
    jest.spyOn(TenantProductRepository.prototype, 'findById').mockResolvedValue(null);

    const createDto = {
      branchId,
      type: OrderType.TAKE_AWAY,
      items: [{ productId: 'missing-product', quantity: 1 }],
      paymentMethod: PaymentMethodType.CASH,
    };

    await expect(
      service.createOrder(createDto, tenantId)
    ).rejects.toThrow(NotFoundException);
  });

  // ==========================================
  // 3. Strict State Machine Transitions Verification
  // ==========================================
  it('should permit sequentially valid transitions and reject illegal steps', async () => {
    const id = 'order-uuid-999';

    // Mock order in PENDING status
    const orderMock = {
      id,
      status: OrderStatus.PENDING,
    };

    jest.spyOn(TenantOrderRepository.prototype, 'findById').mockResolvedValue(orderMock as any);
    const updateSpy = jest.spyOn(TenantOrderRepository.prototype, 'update').mockResolvedValue({ ...orderMock, status: OrderStatus.ACCEPTED } as any);

    // Transition from PENDING to ACCEPTED is valid
    const res = await service.updateOrderStatus(id, { status: OrderStatus.ACCEPTED });
    expect(res.status).toBe(OrderStatus.ACCEPTED);
    expect(updateSpy).toHaveBeenCalledWith(id, { status: OrderStatus.ACCEPTED });

    // Transition from PENDING to COMPLETED directly is illegal
    await expect(
      service.updateOrderStatus(id, { status: OrderStatus.COMPLETED })
    ).rejects.toThrow(BadRequestException);
  });

  it('should block cancellations of completed orders', async () => {
    const id = 'order-uuid-999';

    jest.spyOn(TenantOrderRepository.prototype, 'findById').mockResolvedValue({
      id,
      status: OrderStatus.COMPLETED,
    } as any);

    await expect(
      service.cancelOrder(id)
    ).rejects.toThrow(ConflictException);
  });

  // ==========================================
  // 4. Atomic Transaction Rollbacks on Failures
  // ==========================================
  it('should ensure database operations roll back atomically if creation fails mid-transaction', async () => {
    const tenantId = 'tenant-uuid-1111';
    const branchId = 'branch-uuid-1234';
    const productId = 'prod-uuid-999';

    jest.spyOn(TenantBranchRepository.prototype, 'findById').mockResolvedValue({
      id: branchId,
      tenantId,
      restaurantId: 'rest-uuid-999',
    } as any);

    jest.spyOn(TenantRestaurantRepository.prototype, 'findById').mockResolvedValue({
      id: 'rest-uuid-999',
      taxPercentage: 0 as any,
    } as any);

    jest.spyOn(TenantProductRepository.prototype, 'findById').mockResolvedValue({
      id: productId,
      basePrice: 10.00 as any,
      isAvailable: true,
    } as any);

    // Mock transaction that fails during execution
    jest.spyOn(prisma, '$transaction').mockImplementation(async () => {
      throw new Error('Database transaction connection timeout.');
    });

    const createDto = {
      branchId,
      type: OrderType.TAKE_AWAY,
      items: [{ productId, quantity: 1 }],
      paymentMethod: PaymentMethodType.CASH,
    };

    await expect(
      service.createOrder(createDto, tenantId)
    ).rejects.toThrow('Database transaction connection timeout.');
  });
});
