import { IsString, IsDateString, IsInt, IsOptional } from 'class-validator';

export class CreateMaintenanceDto {
  @IsInt()
  jewelryId: number;

  @IsDateString()
  date: string;

  @IsString()
  type: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  result?: string;
}
