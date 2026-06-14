import { IsString, IsBoolean, IsDateString, IsInt, IsOptional } from 'class-validator';

export class CreateOutfitDto {
  @IsInt()
  jewelryId: number;

  @IsDateString()
  wearDate: string;

  @IsString()
  outfitTags: string;

  @IsBoolean()
  @IsOptional()
  isAllergic?: boolean;

  @IsBoolean()
  @IsOptional()
  isFading?: boolean;

  @IsString()
  cleanStatus: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
