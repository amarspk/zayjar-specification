import { Controller, Post, Get, Body, Req, Res, HttpStatus, HttpCode, UseGuards, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JWT_CONFIG } from './config/jwt.config';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from '@zayjar/types';
import { MfaVerifyRequestDto } from './dto/mfa-verify-request.dto';

@Controller('api/v1/auth')
export class AuthController {
  private readonly logger = new Logger('AuthController');

  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    // NOTE: Direct DB login check is scheduled for TSK-1.6.
    // Here we initialize the baseline token generation using Mock payload structures.
    const mockUserPayload = {
      sub: 'u410c-9a1b-42b8-bf83-097a18fcd34c',
      email: dto.email || 'guest@zayjar.com',
      tenantId: '7a18f-39b0-4050-bf83-097a18fcd34b',
      roles: ['RESTAURANT_OWNER'],
      permissions: ['menu:create', 'menu:update', 'orders:read'],
    };

    const { accessToken, refreshToken } = await this.authService.generateTokens(mockUserPayload);

    // Set secure HTTP-Only sliding cookie
    res.cookie('__Host-Refresh-Token', refreshToken, JWT_CONFIG.cookieOptions);

    return {
      accessToken,
      expiresIn: 900,
      user: {
        id: mockUserPayload.sub,
        tenantId: mockUserPayload.tenantId,
        email: mockUserPayload.email,
        roles: mockUserPayload.roles,
      }
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
