export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskFactor {
  type: string;
  score: number;
  description: string;
}

export interface RiskScoreResult {
  score: number;
  level: RiskLevel;
  levelText: string;
  factors: RiskFactor[];
  reminders: string[];
}

export interface JewelryStatusFlags {
  isInRepair: boolean;
  isLentOut: boolean;
  isOverdue: boolean;
  isLongIdle: boolean;
  idleDays: number;
  isUninsured: boolean;
  isValuationExpired: boolean;
  isMissingCredentials: boolean;
  missingCredentialTypes: string[];
  isInsuranceExpiring: boolean;
  isInsuranceExpired: boolean;
  insuranceDaysRemaining: number;
  daysSinceValuation: number;
  isHighRiskMaterial: boolean;
  hasAllergyHistory: boolean;
  hasFadingHistory: boolean;
}

export interface AssetStatusTag {
  label: string;
  type: 'danger' | 'warning' | 'success' | 'info';
}

export interface JewelryFullStatus {
  risk: RiskScoreResult;
  status: JewelryStatusFlags;
  assetTags: AssetStatusTag[];
  insuranceWarning: {
    hasRisk: boolean;
    warnings: string[];
  };
  availability: {
    available: boolean;
    reasons: string[];
    statusInfo: {
      lending: any;
      repair: any;
      riskScore: number;
      riskLevel: RiskLevel;
    };
  };
}

export interface AvailabilityCheckOptions {
  planDate?: Date;
  includeRisk?: boolean;
}

export const SEVERE_PROBLEM_TYPES = ['断裂', '断链', '掉钻', '严重变形'];
export const HIGH_RISK_MATERIALS = ['合金', '其他'];
export const REQUIRED_CREDENTIAL_TYPES = ['购买凭证', '鉴定证书'];
export const VALUATION_EXPIRY_DAYS = 365;
export const VALUATION_WARNING_DAYS = 270;
export const INSURANCE_WARNING_DAYS = 30;
export const HIGH_VALUE_THRESHOLD = 5000;
export const HIGH_VALUE_DISPLAY_THRESHOLD = 10000;
export const IDLE_LONG_THRESHOLD = 90;
export const IDLE_MEDIUM_THRESHOLD = 60;
export const IDLE_SHORT_THRESHOLD = 30;
