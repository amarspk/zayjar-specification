import { IsString, IsNotEmpty, IsInt, Min, Max } from 'class-validator';

export class CreateTableRequestDto {
  @IsString()
  @IsNotEmpty()
  branchId!: string;

  @IsString()
  @IsNotEmpty()
  number!: string;

  @IsInt()
  @Min(1)
  @Max(100)
  seatingCapacity!: number;
}
