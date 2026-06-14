import { IsString, IsDateString, IsInt, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateLendingDto {
  @IsInt()
  jewelryId: number;

  @IsString()
  borrowerName: string;

  @IsString()
  borrowerContact: string;

  @IsDateString()
  lendDate: string;

  @IsDateString()
  expectedReturnDate: string;

  @IsString()
  purpose: string;

  @IsOptional()
  @IsNumber()
  deposit?: number;

  @IsString()
  conditionBeforeLend: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReturnLendingDto {
  @IsOptional()
  @IsString()
  returnCondition?: string;

  @IsOptional()
  @IsBoolean()
  hasWear?: boolean;

  @IsOptional()
  @IsNumber()
  compensationAmount?: number;

  @IsOptional()
  @IsDateString()
  actualReturnDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
