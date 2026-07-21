import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray, ValidateNested, IsInt, Min, ArrayNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderType, PaymentMethodType } from '@zayjar/types';

export class OrderAddonSelectionDto {
  @IsString()
  @IsNotEmpty()
  addonItemId!: string;
}

export class OrderItemSelectionDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsString()
  @IsOptional()
  sizeId?: string;

  @IsString()
  @IsOptional()
  variantId?: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => OrderAddonSelectionDto)
  addons?: OrderAddonSelectionDto[];
}

export class CreateOrderRequestDto {
  @IsString()
  @IsNotEmpty()
  branchId!: string;

  @IsString()
  @IsOptional()
  tableId?: string;

  @IsEnum(OrderType)
  @IsNotEmpty()
  type!: OrderType;

  @IsString()
  @IsOptional()
  specialNotes?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => OrderItemSelectionDto)
  items!: OrderItemSelectionDto[];

  @IsEnum(PaymentMethodType)
  @IsNotEmpty()
  paymentMethod!: PaymentMethodType;
}
