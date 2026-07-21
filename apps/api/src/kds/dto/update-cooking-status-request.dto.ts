import { IsEnum, IsNotEmpty } from 'class-validator';
import { CookingStatus } from '@zayjar/types';

export class UpdateCookingStatusRequestDto {
  @IsEnum(CookingStatus)
  @IsNotEmpty()
  status!: CookingStatus;
}
