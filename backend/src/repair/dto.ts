import { IsString, IsDateString, IsInt, IsOptional, IsNumber, ValidateIf } from 'class-validator';

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

  @ValidateIf((o) => o.status === '已完成')
  @IsDateString({}, { message: '维修已完成时取件日期为必填项' })
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

  @ValidateIf((o) => o.status === '已完成')
  @IsDateString({}, { message: '维修已完成时取件日期为必填项' })
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
