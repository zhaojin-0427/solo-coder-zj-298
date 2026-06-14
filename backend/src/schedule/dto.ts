import { IsDateString, IsString, IsOptional, IsInt, Min, IsArray, ArrayNotEmpty, ValidateIf } from 'class-validator';

export class CreateWearPlanDto {
  @IsDateString()
  planDate: string;

  @IsString()
  scenario: string;

  @ValidateIf((o) => typeof o.outfitTags === 'string')
  @IsString()
  @ValidateIf((o) => Array.isArray(o.outfitTags))
  @IsArray()
  outfitTags: string | string[];

  @IsArray()
  @ArrayNotEmpty()
  candidateJewelryIds: number[];

  @IsOptional()
  @IsInt()
  @Min(1)
  priority?: number;

  @IsOptional()
  @IsString()
  forbiddenConditions?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ConfirmWearPlanDto {
  @IsArray()
  @ArrayNotEmpty()
  selectedJewelryIds: number[];
}

export class ResolveConflictDto {
  @IsInt()
  newJewelryId: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export interface RecommendationFactor {
  type: string;
  name: string;
  score: number;
  maxScore: number;
  description: string;
}

export interface JewelryRecommendation {
  jewelryId: number;
  jewelryName: string;
  material: string;
  color: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  isAvailable: boolean;
  unavailableReasons: string[];
  riskLevel: string;
  riskLevelText: string;
  riskScore: number;
  factors: RecommendationFactor[];
  reminders: string[];
}

export interface ScheduleConflict {
  id: number;
  wearPlanId: number;
  planDate: string;
  scenario: string;
  jewelryId: number;
  jewelryName: string;
  conflictType: 'lending' | 'overdue' | 'repair' | 'pending_pickup' | 'high_risk' | 'critical_risk';
  conflictTypeText: string;
  description: string;
  severity: 'warning' | 'danger';
  status: string;
}

export interface PlanItemDetail {
  id: number;
  jewelryId: number;
  jewelryName: string;
  material: string;
  recommendationScore: number;
  riskLevel: string;
  riskLevelText: string;
  riskScore: number;
  unavailableReasons: string;
  isAvailable: boolean;
  isSelected: boolean;
  factors: string;
}

export interface WearPlanDetail {
  id: number;
  planDate: string;
  scenario: string;
  outfitTags: string;
  priority: number;
  forbiddenConditions: string;
  status: string;
  confirmedAt: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  items: PlanItemDetail[];
  selectedJewelryNames: string[];
}
