import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { CreateTenantRequestDto } from './dto/create-tenant-request.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('api/v1/tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async onboard(@Body() dto: CreateTenantRequestDto) {
    return this.tenantService.onboard(dto);
  }
}
