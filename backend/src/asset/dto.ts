import { IsString, IsNumber, IsDateString, IsOptional, IsBoolean } from 'class-validator';

export class CreateValuationDto {
  @IsNumber()
  jewelryId: number;

  @IsNumber()
  currentValue: number;

  @IsDateString()
  valuationDate: string;

  @IsString()
  valuationAgency: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateInsuranceDto {
  @IsNumber()
  jewelryId: number;

  @IsString()
  policyNumber: string;

  @IsString()
  insuranceCompany: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsNumber()
  insuredAmount: number;

  @IsOptional()
  @IsNumber()
  deductible?: number;

  @IsString()
  claimsContact: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateInsuranceDto {
  @IsOptional()
  @IsString()
  policyNumber?: string;

  @IsOptional()
  @IsString()
  insuranceCompany?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  insuredAmount?: number;

  @IsOptional()
  @IsNumber()
  deductible?: number;

  @IsOptional()
  @IsString()
  claimsContact?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateCredentialDto {
  @IsNumber()
  jewelryId: number;

  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  credentialNumber?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @IsOptional()
  @IsString()
  issuedBy?: string;
}

export class UpdateCredentialDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  credentialNumber?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @IsOptional()
  @IsString()
  issuedBy?: string;
}

export class RenewInsuranceDto {
  @IsString()
  policyNumber: string;

  @IsString()
  insuranceCompany: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsNumber()
  insuredAmount: number;

  @IsOptional()
  @IsNumber()
  deductible?: number;

  @IsOptional()
  @IsString()
  claimsContact?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
