import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class CreateBillingSessionRequestDto {
  @IsString()
  @IsNotEmpty()
  planId!: string;

  @IsUrl()
  @IsNotEmpty()
  successUrl!: string;

  @IsUrl()
  @IsNotEmpty()
  cancelUrl!: string;
}
