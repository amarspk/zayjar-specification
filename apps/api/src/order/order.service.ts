import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { CreateOrderRequestDto } from './dto/create-order-request.dto';
import { UpdateOrderStatusRequestDto } from './dto/update-order-status-request.dto';
import { OrderStatus } from '@zayjar/types';
import {
  TenantOrderRepository,
  TenantBranchRepository,
  TenantProductRepository,
  TenantProductSizeRepository,
  TenantAddonItemRepository,
  TenantInvoiceRepository,
  TenantRestaurantRepository,
  prisma,
} from '@zayjar/db';

@Injectable()
export class OrderService {
  private readonly logger = new Logger('OrderService');

  private readonly orderRepository = new TenantOrderRepository();
  private readonly branchRepository = new TenantBranchRepository();
  private readonly productRepository = new TenantProductRepository();
  private readonly sizeRepository = new TenantProductSizeRepository();
  private readonly addonItemRepository = new TenantAddonItemRepository();
  private readonly invoiceRepository = new TenantInvoiceRepository();
  private readonly restaurantRepository = new TenantRestaurantRepository();

  /**
   * Orchestrates a secure checkout transaction.
   * Maps exactly to the transactional architecture requirements in TSK-2.0.
   */
  async createOrder(dto: CreateOrderRequestDto, userTenantId: string) {
    this.logger.log(`Initiating checkout transaction for tenant: [${userTenantId}]`);

    // 1. Validate branch ownership and resolve parameters
    const branch = await this.branchRepository.findById(dto.branchId);
    if (!branch) {
      throw new NotFoundException(`The selected branch with ID [${dto.branchId}] was not found.`);
    }

    // Resolve the parent restaurant brand to extract tax settings safely
    const restaurant = await this.restaurantRepository.findById(branch.restaurantId);
    if (!restaurant) {
      throw new NotFoundException(`The parent restaurant brand was not found under this tenant context.`);
    }

    let subtotal = 0;
    const orderItemsToCreate: any[] = [];

    // 2. Validate products and calculate totals strictly using database values
    for (const item of dto.items) {
      const product = await this.productRepository.findById(item.productId);
      if (!product || !product.isAvailable) {
        throw new NotFoundException(`Product with ID [${item.productId}] is unavailable or missing.`);
      }

      let unitPrice = Number(product.basePrice);

      // A. Evaluate sizing adjustments
      if (item.sizeId) {
        const size = await this.sizeRepository.findMany({ id: item.sizeId, productId: product.id });
        if (size.length === 0) {
          throw new BadRequestException(`Sizing modifier [${item.sizeId}] is invalid for this product.`);
        }
        unitPrice += Number(size[0].priceAdjustment);
      }

      let lineAddonsTotal = 0;
      const addonsToCreate: any[] = [];

      // B. Evaluate addons and choice selections
      if (item.addons && item.addons.length > 0) {
        for (const addonSelection of item.addons) {
          const addonItem = await this.addonItemRepository.findMany({ id: addonSelection.addonItemId });
          if (addonItem.length === 0 || !addonItem[0].isAvailable) {
            throw new BadRequestException(`Selected addon [${addonSelection.addonItemId}] is unavailable.`);
          }
          lineAddonsTotal += Number(addonItem[0].price);
          addonsToCreate.push({
            tenantId: userTenantId,
            addonItemId: addonItem[0].id,
            price: addonItem[0].price,
          });
        }
      }

      const totalLinePrice = (unitPrice + lineAddonsTotal) * item.quantity;
      subtotal += totalLinePrice;

      orderItemsToCreate.push({
        tenantId: userTenantId,
        productId: product.id,
        sizeId: item.sizeId || null,
        variantId: item.variantId || null,
        quantity: item.quantity,
        unitPrice,
        totalPrice: totalLinePrice,
        cookingStatus: 'PENDING',
        orderItemAddons: {
          create: addonsToCreate,
        },
      });
    }

    // 3. Compute totals on the server
    const taxRate = Number(restaurant.taxPercentage || 0.00) / 100;
    const taxAmount = Number((subtotal * taxRate).toFixed(2));
    const discountAmount = 0.00; // Placeholders for discount engines
    const total = Number((subtotal + taxAmount - discountAmount).toFixed(2));

    const orderNumber = `ORD-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    // 4. Execute atomic database transaction
    return prisma.$transaction(async (tx: any) => {
      const order = await tx.order.create({
        data: {
          tenantId: userTenantId,
          branchId: dto.branchId,
          tableId: dto.tableId || null,
          orderNumber,
          type: dto.type,
          status: 'PENDING', // Awaiting payment/dispatch confirmation
          subtotal,
          taxAmount,
          discountAmount,
          total,
          specialNotes: dto.specialNotes || null,
          orderItems: {
            create: orderItemsToCreate,
          },
        },
        include: {
          orderItems: {
            include: {
              orderItemAddons: true,
            },
          },
        },
      });

      this.logger.log(`Order checkout created atomically inside database. Reference: [${orderNumber}]`);
      return order;
    });
  }

  /**
   * Safe lookup by id.
   */
  async getOrder(id: string) {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException(`Order with ID [${id}] was not found.`);
    }
    return order;
  }

  /**
   * Safe listing scoped to tenant.
   */
  async getOrders(branchId?: string) {
    const where: Record<string, any> = {};
    if (branchId) {
      where.branchId = branchId;
    }
    return this.orderRepository.findMany(where);
  }

  /**
   * Enforces State-Machine validations during order status mutations.
   * Automatically generates billing invoices upon successful completion.
   */
  async updateOrderStatus(id: string, dto: UpdateOrderStatusRequestDto) {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException(`Order with ID [${id}] was not found.`);
    }

    this.validateStateTransition(order.status as OrderStatus, dto.status);

    // Save status update
    const updatedOrder = await this.orderRepository.update(id, {
      status: dto.status,
    });

    // ==========================================
    // INVOICING TRIGGER UPON COMPLETION
    // ==========================================
    if (dto.status === OrderStatus.COMPLETED) {
      await this.generateInvoice(updatedOrder);
    }

    return updatedOrder;
  }

  /**
   * Safe cancellation.
   */
  async cancelOrder(id: string) {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException(`Order with ID [${id}] was not found.`);
    }

    if (order.status === OrderStatus.COMPLETED) {
      throw new ConflictException('Completed orders cannot be cancelled.');
    }

    return this.orderRepository.update(id, {
      status: OrderStatus.CANCELLED,
    });
  }

  /**
   * Strict State Machine Transition Evaluator.
   */
  private validateStateTransition(current: OrderStatus, next: OrderStatus) {
    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      DRAFT: [OrderStatus.PENDING, OrderStatus.CANCELLED],
      PENDING: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED],
      ACCEPTED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      PREPARING: [OrderStatus.READY, OrderStatus.CANCELLED],
      READY: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      COMPLETED: [], // Terminal State
      CANCELLED: [], // Terminal State
    };

    const routes = allowedTransitions[current] || [];
    if (!routes.includes(next)) {
      throw new BadRequestException(`Forbidden transition: Cannot move order from [${current}] directly to [${next}].`);
    }
  }

  /**
   * Safely generates an accounting invoice.
   */
  private async generateInvoice(order: any) {
    this.logger.log(`Order status marked as completed. Generating billing invoice record...`);

    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const pdfUrl = `https://cdn.zayjar.com/invoices/${invoiceNumber}.pdf`;

    return this.invoiceRepository.create({
      tenantId: order.tenantId,
      orderId: order.id,
      invoiceNumber,
      pdfUrl,
    });
  }
}
