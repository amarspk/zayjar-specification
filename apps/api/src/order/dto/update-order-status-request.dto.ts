import { IsEnum, IsNotEmpty } from 'class-validator';
import { OrderStatus } from '@zayjar/types';

export class UpdateOrderStatusRequestDto {
  @IsEnum(OrderStatus)
  @IsNotEmpty()
  status!: OrderStatus;
}
