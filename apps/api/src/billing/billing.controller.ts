import { Controller, Post, Body, Req, UseGuards, HttpCode, HttpStatus, ForbiddenException } from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreateBillingSessionRequestDto } from './dto/create-billing-session-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/v1/billing/subscriptions')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  /**
   * POST /api/v1/billing/subscriptions/create-session
   * Per DOC-003 3.9.1
   * Auth: Bearer, Permission: billing:write (RESTAURANT_OWNER only)
   * Tenant isolation: tenantId from JWT, never from client
   */
  @Post('create-session')
  @HttpCode(HttpStatus.OK)
  async createSession(@Body() dto: CreateBillingSessionRequestDto, @Req() req: any) {
    const user = req.user;
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const tenantId = user.tenantId;
    const userId = user.id || user.sub;
    const roles = user.roles || [];

    // Enforce RESTAURANT_OWNER role for billing:write per spec
    if (!roles.includes('RESTAURANT_OWNER') && !roles.includes('PLATFORM_OWNER')) {
      throw new ForbiddenException('Access Denied: billing:write permission requires RESTAURANT_OWNER role');
    }

    if (!tenantId) {
      throw new ForbiddenException('Tenant context missing from authenticated request');
    }

    return this.billingService.createCheckoutSession(dto, tenantId, userId);
  }
}
