import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateBillingSessionRequestDto } from './dto/create-billing-session-request.dto';
import { prisma } from '@zayjar/db';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  /**
   * Creates a Stripe Checkout Session for subscription onboarding or plan upgrade.
   * Per DOC-003 3.9.1
   * Tenant isolation: plan must exist, tenant context validated.
   * If STRIPE_SECRET_KEY not configured, returns mock session for dev/test.
   */
  async createCheckoutSession(dto: CreateBillingSessionRequestDto, tenantId: string, userId: string) {
    this.logger.log(`Creating Stripe checkout session for tenant [${tenantId}] plan [${dto.planId}] user [${userId}]`);

    // Validate plan exists
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: dto.planId },
    });

    if (!plan) {
      throw new NotFoundException(`Subscription plan with ID [${dto.planId}] not found.`);
    }

    // Validate tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID [${tenantId}] not found.`);
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    // If Stripe key not present, return mock session (for dev, test, CI)
    if (!stripeSecretKey) {
      this.logger.warn('STRIPE_SECRET_KEY not configured, returning mock checkout session');
      const mockSessionId = `cs_test_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      const mockUrl = `https://checkout.stripe.com/c/pay/${mockSessionId}`;

      return {
        checkoutSessionId: mockSessionId,
        stripeCheckoutUrl: mockUrl,
      };
    }

    // Real Stripe integration
    try {
      // Dynamic import to avoid hard dependency if not installed
      const Stripe = require('stripe');
      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16',
      });

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: (tenant as any).stripeCustomerId || undefined,
        line_items: [
          {
            price: plan.stripePriceId,
            quantity: 1,
          },
        ],
        success_url: dto.successUrl,
        cancel_url: dto.cancelUrl,
        metadata: {
          tenantId,
          planId: dto.planId,
          userId,
        },
      });

      return {
        checkoutSessionId: session.id,
        stripeCheckoutUrl: session.url,
      };
    } catch (err) {
      this.logger.error(`Stripe checkout session creation failed: ${(err as Error).message}`);
      throw new BadRequestException(`Failed to create Stripe checkout session: ${(err as Error).message}`);
    }
  }
}
