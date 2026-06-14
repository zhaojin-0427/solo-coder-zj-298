import type { RiskLevel, RiskAssessment, Jewelry, Outfit, Repair, Valuation, Insurance, Credential, AssetStatusTag } from '../types';
import { calculateRiskScore } from './unified-risk';

export {
  SEVERE_PROBLEM_TYPES,
  HIGH_RISK_MATERIALS,
  REQUIRED_CREDENTIAL_TYPES,
  VALUATION_EXPIRY_DAYS,
  VALUATION_WARNING_DAYS,
  INSURANCE_WARNING_DAYS,
  HIGH_VALUE_THRESHOLD,
  HIGH_VALUE_DISPLAY_THRESHOLD,
  IDLE_LONG_THRESHOLD,
  IDLE_MEDIUM_THRESHOLD,
  IDLE_SHORT_THRESHOLD,
  getRiskLevelInfo,
  getRiskTagType,
  getReminderTypeInfo,
  calculateIdleDays,
  calculateRiskScore,
  calculateStatusFlags,
  generateAssetStatusTags,
  getInsuranceRiskWarning,
  getCredentialCompleteness,
  mergeFullStatusToJewelry,
} from './unified-risk';

export const calculateRiskLocally = (
  jewelry: Jewelry & { outfits?: Outfit[]; repairs?: Repair[] },
): RiskAssessment => {
  const riskResult = calculateRiskScore(jewelry);
  return {
    jewelryId: jewelry.id,
    jewelryName: jewelry.name,
    level: riskResult.level,
    levelText: riskResult.levelText,
    score: riskResult.score,
    factors: riskResult.factors,
    reminders: riskResult.reminders,
  };
};
