import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class MfaVerifyRequestDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'mfaToken must be a 6-digit numeric code' })
  mfaToken!: string;
}
