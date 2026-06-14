import { IsString, IsDateString, IsInt, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class CreateRepairDto {
  @IsInt()
  jewelryId: number;

  @IsString()
  problemType: string;

  @IsDateString()
  sendDate: string;

  @IsString()
  repairItems: string;

  @IsNumber()
  cost: number;

  @IsOptional()
  @IsDateString()
  returnDate?: string;

  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateRepairDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDateString()
  returnDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  cost?: number;

  @IsOptional()
  @IsString()
  repairItems?: string;
}
