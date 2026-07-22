import { Controller, Post, Get, Body, Req, Res, HttpStatus, HttpCode, UseGuards, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JWT_CONFIG } from './config/jwt.config';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from '@zayjar/types';
import { MfaVerifyRequestDto } from './dto/mfa-verify-request.dto';
import { RateLimitGuard, RateLimit } from '../common/rate-limit/rate-limit.guard';

@Controller('api/v1/auth')
export class AuthController {
  private readonly logger = new Logger('AuthController');

  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  @RateLimit('auth')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Resolve tenantId from middleware (subdomain, custom domain, x-tenant-id header) for tenant isolation
    const tenantId = (req as any).tenantId || null;

    if (!dto.email || !dto.password) {
      throw new Error('Email and password are required');
    }

    // Real DB login with tenant isolation, password verification, and MFA check
    const userProfile = await this.authService.validateLogin(dto.email, dto.password!, (dto as any).mfaToken, tenantId);

    const payload = {
      sub: userProfile.id,
      email: userProfile.email,
      tenantId: userProfile.tenantId,
      roles: userProfile.roles,
      permissions: userProfile.permissions,
    };

    const { accessToken, refreshToken } = await this.authService.generateTokens(payload);

    // Set secure HTTP-Only sliding cookie
    res.cookie('__Host-Refresh-Token', refreshToken, JWT_CONFIG.cookieOptions);

    return {
      accessToken,
      expiresIn: 900,
      user: {
        id: payload.sub,
        tenantId: payload.tenantId,
        email: payload.email,
        roles: payload.roles,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        mfaRequired: false,
        mfaEnabled: userProfile.mfaEnabled,
      },
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Extract token from secure cookie
    const oldRefreshToken = req.cookies?.['__Host-Refresh-Token'];

    if (!oldRefreshToken) {
      throw new Error('Refresh session cookie is missing.');
    }

    const { accessToken, refreshToken } = await this.authService.rotateRefreshToken(oldRefreshToken);

    // Rotate and set fresh sliding cookie
    res.cookie('__Host-Refresh-Token', refreshToken, JWT_CONFIG.cookieOptions);

    return {
      accessToken,
      expiresIn: 900,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user: any,
  ) {
    this.logger.log(`Logging out user session for sub: ${user?.id || 'unknown'}`);
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      // Blacklist access token for its remaining life (e.g. 15 minutes)
      await this.authService.blacklistToken(token, 900);
    }

    // Clear refresh cookie
    res.clearCookie('__Host-Refresh-Token', JWT_CONFIG.cookieOptions);

    return {
      success: true,
      message: 'Active session successfully terminated.'
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMe(@CurrentUser() user: any) {
    // user contains id, tenantId, email, roles, permissions from JWT
    const profile = await this.authService.getMe(user.id, user.tenantId);

    return {
      user: {
        id: profile.id,
        tenantId: profile.tenantId,
        firstName: (profile as any).firstName,
        lastName: (profile as any).lastName,
        email: user.email || (profile as any).email,
        roles: user.roles || [],
        permissions: user.permissions || [],
        mfaEnabled: (profile as any).mfaEnabled || false,
      },
    };
  }

  @Post('mfa/enable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async enableMfa(@CurrentUser() user: any) {
    const result = await this.authService.generateMfaSecret(user.id, user.tenantId, user.email);
    return result;
  }

  @Post('mfa/verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verifyMfa(@CurrentUser() user: any, @Body() dto: MfaVerifyRequestDto) {
    const result = await this.authService.verifyMfaSetup(user.id, user.tenantId, dto.mfaToken);
    return result;
  }
}
