import { Controller, Post, Get, Body, Param, Req, UseGuards, HttpCode, HttpStatus, ForbiddenException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CreateWalletPaymentRequestDto } from './dto/create-wallet-payment-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/v1/payments')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private readonly walletService: WalletService) {}

  /**
   * POST /api/v1/payments/wallet
   * Creates regional wallet payment session per DOC-009 8.3
   * Supports Apple Pay, Google Pay via Stripe, and KNET, Benefit, Mada via Tap Payments
   * Tenant isolation via JWT tenantId
   */
  @Post('wallet')
  @HttpCode(HttpStatus.CREATED)
  async createWalletPayment(@Body() dto: CreateWalletPaymentRequestDto, @Req() req: any) {
    const user = req.user;
    if (!user?.tenantId) {
      throw new ForbiddenException('Tenant context missing');
    }
    const userId = user.id || user.sub;
    return this.walletService.createWalletPayment(dto, user.tenantId, userId);
  }

  /**
   * GET /api/v1/payments/wallet/:paymentId/verify
   * Verifies wallet payment status
   */
  @Get('wallet/:paymentId/verify')
  @HttpCode(HttpStatus.OK)
  async verifyPayment(@Param('paymentId') paymentId: string, @Req() req: any) {
    const user = req.user;
    if (!user?.tenantId) {
      throw new ForbiddenException('Tenant context missing');
    }
    return this.walletService.verifyPayment(paymentId, user.tenantId);
  }
}
