import { Controller, Post, Body, Req, UseGuards, HttpCode, HttpStatus, ForbiddenException } from '@nestjs/common';
import { AssetService } from './asset.service';
import { CreatePresignedUrlRequestDto } from './dto/create-presigned-url-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/v1/assets')
@UseGuards(JwtAuthGuard)
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  /**
   * POST /api/v1/assets/presigned-url
   * Per DOC-007 6.1 Direct S3 Pre-Signed Upload Flow
   * Auth: Bearer, Tenant isolation via JWT tenantId, never from client
   */
  @Post('presigned-url')
  @HttpCode(HttpStatus.OK)
  async createPresignedUrl(@Body() dto: CreatePresignedUrlRequestDto, @Req() req: any) {
    const user = req.user;
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const tenantId = user.tenantId;
    const userId = user.id || user.sub;

    if (!tenantId) {
      throw new ForbiddenException('Tenant context missing from authenticated request');
    }

    return this.assetService.createPresignedUrl(dto, tenantId, userId);
  }
}
