import { Controller, Post, Get, Delete, Param, Body, Req, UseGuards, HttpCode, HttpStatus, ForbiddenException, Query } from '@nestjs/common';
import { DeviceTokenService } from './device-token.service';
import { CreateDeviceTokenRequestDto } from './dto/create-device-token-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/v1/device-tokens')
@UseGuards(JwtAuthGuard)
export class DeviceTokenController {
  constructor(private readonly deviceTokenService: DeviceTokenService) {}

  /**
   * POST /api/v1/device-tokens
   * Registers FCM device token per DOC-008 7.4
   * Tenant isolation via JWT tenantId
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async registerToken(@Body() dto: CreateDeviceTokenRequestDto, @Req() req: any) {
    const user = req.user;
    if (!user?.tenantId) {
      throw new ForbiddenException('Tenant context missing');
    }
    const requesterUserId = user.id || user.sub;
    return this.deviceTokenService.registerToken(dto, user.tenantId, requesterUserId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async listTokens(@Req() req: any, @Query('userId') userId?: string) {
    const user = req.user;
    if (!user?.tenantId) {
      throw new ForbiddenException('Tenant context missing');
    }
    // Non-platform owners can only list own tokens unless they are managers
    const roles = user.roles || [];
    const isPrivileged = roles.includes('RESTAURANT_OWNER') || roles.includes('BRANCH_MANAGER') || roles.includes('PLATFORM_OWNER');
    const targetUserId = isPrivileged && userId ? userId : user.id || user.sub;
    return this.deviceTokenService.listTokens(user.tenantId, targetUserId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteToken(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    if (!user?.tenantId) {
      throw new ForbiddenException('Tenant context missing');
    }
    const requesterUserId = user.id || user.sub;
    return this.deviceTokenService.deleteToken(id, user.tenantId, requesterUserId);
  }
}
