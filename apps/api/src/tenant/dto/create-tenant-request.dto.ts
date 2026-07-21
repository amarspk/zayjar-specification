import { IsString, IsEmail, IsNotEmpty, Length, Matches } from 'class-validator';

export class CreateTenantRequestDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  companyName!: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 63)
  @Matches(/^[a-z0-9-]+$/, { message: 'Subdomain must contain only lowercase alphanumeric characters and hyphens.' })
  subdomain!: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  ownerFirstName!: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  ownerLastName!: string;

  @IsEmail()
  @IsNotEmpty()
  ownerEmail!: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 64)
  ownerPassword!: string;

  @IsString()
  @IsNotEmpty()
  planId!: string;
}
