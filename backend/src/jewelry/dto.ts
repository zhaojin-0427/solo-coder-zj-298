import { IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateJewelryDto {
  @IsString()
  name: string;

  @IsString()
  material: string;

  @IsString()
  color: string;

  @IsDateString()
  purchaseDate: string;

  @IsString()
  storageLocation: string;

  @IsString()
  suitableScenarios: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  purchasePrice?: number;

  @IsOptional()
  @IsString()
  invoiceNumber?: string;
}

export class UpdateJewelryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  material?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @IsOptional()
  @IsString()
  storageLocation?: string;

  @IsOptional()
  @IsString()
  suitableScenarios?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  purchasePrice?: number;

  @IsOptional()
  @IsString()
  invoiceNumber?: string;
}
