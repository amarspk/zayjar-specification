import { IsString, IsNotEmpty, IsUrl, IsArray, ArrayNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateWebhookRequestDto {
  @IsUrl()
  @IsNotEmpty()
  targetUrl!: string;

  @IsString()
  @IsNotEmpty()
  secretKey!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  events!: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
