export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskFactor {
  type: string;
  score: number;
  description: string;
}

export interface RiskAssessment {
  jewelryId: number;
  jewelryName: string;
  level: RiskLevel;
  levelText: string;
  score: number;
  factors: RiskFactor[];
  reminders: string[];
}

export interface RiskJewelryRanking {
  id: number;
  name: string;
  material: string;
  level: RiskLevel;
  levelText: string;
  score: number;
  topFactor: string;
}

export interface PendingReminder {
  jewelryId: number;
  jewelryName: string;
  type: 'allergy' | 'repair' | 'idle' | 'cleaning' | 'fading' | 'high_cost';
  title: string;
  description: string;
  level: RiskLevel;
}

export interface HighRiskMaterial {
  material: string;
  count: number;
  averageScore: number;
  highRiskCount: number;
}

export interface RiskStats {
  rankings: RiskJewelryRanking[];
  pendingReminders: PendingReminder[];
  highRiskMaterials: HighRiskMaterial[];
}
