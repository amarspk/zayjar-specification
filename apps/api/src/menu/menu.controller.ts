import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateCategoryRequestDto } from './dto/create-category-request.dto';
import { CreateProductRequestDto } from './dto/create-product-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacPermissionGuard } from '../auth/guards/rbac-permission.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { SubscriptionGuard, RequireSubscriptionCheck } from '../subscription/guards/subscription.guard';

@Controller('api/v1/menu')
@UseGuards(JwtAuthGuard, RbacPermissionGuard, SubscriptionGuard)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post('categories')
  @RequirePermission('create', 'Product')
  async createCategory(@Body() dto: CreateCategoryRequestDto) {
    return this.menuService.createCategory(dto);
  }

  @Get('categories')
  @RequirePermission('read', 'Product')
  async getCategories() {
    return this.menuService.getCategories();
  }

  @Post('products')
  @RequirePermission('create', 'Product')
  @RequireSubscriptionCheck('product')
  async createProduct(@Body() dto: CreateProductRequestDto) {
    return this.menuService.createProduct(dto);
  }

  @Get('products')
  @RequirePermission('read', 'Product')
  async getProducts(@Query('categoryId') categoryId: string) {
    return this.menuService.getProducts(categoryId);
  }

  @Post('sizes')
  @RequirePermission('create', 'Product')
  async createProductSize(
    @Body('productId') productId: string,
    @Body('name') name: string,
    @Body('priceAdjustment') priceAdjustment: number,
  ) {
    return this.menuService.createProductSize(productId, name, priceAdjustment);
  }

  @Post('addons')
  @RequirePermission('create', 'Product')
  async createProductAddon(
    @Body('productId') productId: string,
    @Body('name') name: string,
    @Body('minSelections') minSelections?: number,
    @Body('maxSelections') maxSelections?: number,
  ) {
    return this.menuService.createProductAddon(productId, name, minSelections, maxSelections);
  }

  @Post('addon-items')
  @RequirePermission('create', 'Product')
  async createAddonItem(
    @Body('addonGroupId') addonGroupId: string,
    @Body('name') name: string,
    @Body('price') price: number,
  ) {
    return this.menuService.createAddonItem(addonGroupId, name, price);
  }
}
