import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';

export class CreateDeviceTokenRequestDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['ios', 'android', 'web', 'unknown'])
  deviceType!: string;

  @IsString()
  @IsOptional()
  userId?: string; // optional for admin registering others, otherwise from JWT
}
