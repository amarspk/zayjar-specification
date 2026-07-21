import { IsString, IsNotEmpty, IsInt, Min, Length } from 'class-validator';

export class CreateCategoryRequestDto {
  @IsString()
  @IsNotEmpty()
  restaurantId!: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name!: string;

  @IsInt()
  @Min(0)
  sortOrder!: number;
}
