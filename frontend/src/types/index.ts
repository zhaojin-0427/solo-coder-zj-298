export interface Jewelry {
  id: number;
  name: string;
  material: string;
  color: string;
  purchaseDate: string;
  storageLocation: string;
  suitableScenarios: string;
  imageUrl?: string;
  purchasePrice?: number;
  invoiceNumber?: string;
  createdAt: string;
  outfits?: Outfit[];
  maintenances?: Maintenance[];
  repairs?: Repair[];
  lendings?: Lending[];
  valuations?: Valuation[];
  insurances?: Insurance[];
  credentials?: Credential[];
  _count?: {
    outfits: number;
    maintenances: number;
    repairs: number;
  };
}

export interface Outfit {
  id: number;
  jewelryId: number;
  wearDate: string;
  outfitTags: string;
  isAllergic: boolean;
  isFading: boolean;
  cleanStatus: string;
  notes?: string;
  createdAt: string;
  jewelry?: {
    id: number;
    name: string;
    material: string;
  };
}

export interface Maintenance {
  id: number;
  jewelryId: number;
  date: string;
  type: string;
  description: string;
  result?: string;
  createdAt: string;
  jewelry?: {
    id: number;
    name: string;
  };
}

export interface Repair {
  id: number;
  jewelryId: number;
  problemType: string;
  sendDate: string;
  repairItems: string;
  cost: number;
  returnDate?: string;
  status: string;
  notes?: string;
  createdAt: string;
  jewelry?: {
    id: number;
    name: string;
  };
}

export interface StatsOverview {
  jewelryCount: number;
  outfitCount: number;
  maintenanceCount: number;
  repairCount: number;
  totalRepairCost: number;
}

export interface MaterialFrequency {
  material: string;
  count: number;
}

export interface ProblemDistribution {
  problem: string;
  count: number;
}

export interface OutfitCombination {
  tag: string;
  count: number;
}

export interface OutfitComboPair {
  combination: string;
  count: number;
}

export interface TopCombinationsData {
  combinations: OutfitComboPair[];
  singleTags: OutfitCombination[];
}

export interface IdleJewelry {
  id: number;
  name: string;
  material: string;
  lastWearDate: string | null;
  totalWears: number;
  idleDays: number;
}

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

export interface Lending {
  id: number;
  jewelryId: number;
  borrowerName: string;
  borrowerContact: string;
  lendDate: string;
  expectedReturnDate: string;
  purpose: string;
  deposit: number;
  conditionBeforeLend: string;
  returnCondition?: string;
  hasWear: boolean;
  compensationAmount: number;
  status: string;
  actualReturnDate?: string;
  notes?: string;
  createdAt: string;
  jewelry?: {
    id: number;
    name: string;
    material: string;
  };
}

export interface LendingRankingItem {
  name: string;
  count: number;
}

export interface OverdueReminder {
  id: number;
  jewelryId: number;
  jewelryName: string;
  borrowerName: string;
  borrowerContact: string;
  expectedReturnDate: string;
  overdueDays: number;
  status: string;
}

export interface WearDistribution {
  type: string;
  count: number;
}

export interface LendingStats {
  lendingRanking: LendingRankingItem[];
  overdueReminders: OverdueReminder[];
  wearDistribution: WearDistribution[];
  totalDeposit: number;
  totalCompensation: number;
  totalLendings: number;
  activeLendings: number;
  overdueLendings: number;
}

export interface AllStats {
  overview: StatsOverview;
  materialWearFrequency: MaterialFrequency[];
  problemDistribution: ProblemDistribution[];
  topOutfitCombinations: TopCombinationsData;
  longIdleJewelry: IdleJewelry[];
  riskStats: RiskStats;
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
  riskLevel: RiskLevel;
  riskLevelText: string;
  riskScore: number;
  factors: RecommendationFactor[];
  reminders: string[];
}

export interface PlanItemDetail {
  id: number;
  jewelryId: number;
  jewelryName: string;
  material: string;
  recommendationScore: number;
  riskLevel: RiskLevel;
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

export interface WearPlanSummary {
  id: number;
  planDate: string;
  scenario: string;
  outfitTags: string;
  priority: number;
  status: string;
  confirmedAt: string | null;
  conflictResolved: boolean;
  selectedJewelry: Array<{
    id: number;
    name: string;
    material: string;
  }>;
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

export interface FutureJewelryPlan {
  planId: number;
  planDate: string;
  scenario: string;
  outfitTags: string;
  priority: number;
  recommendationScore: number;
  riskLevel: RiskLevel;
  riskLevelText: string;
}

export interface ScheduleCalendarItem {
  id: number;
  scenario: string;
  outfitTags: string;
  priority: number;
  status: string;
  jewelry: Array<{ id: number; name: string; material: string }>;
}

export interface ScheduleCalendarDay {
  date: string;
  dateStr: string;
  weekday: string;
  plans: ScheduleCalendarItem[];
}

export interface UnavailableReasonItem {
  reason: string;
  count: number;
}

export interface HitTrendItem {
  period: string;
  hitRate: number;
  totalSelected: number;
  hitCount: number;
}

export interface ScheduleStats {
  overview: {
    totalPlans: number;
    confirmedPlans: number;
    pendingPlans: number;
    futurePlannedDays: number;
    averageSelectedPerPlan: number;
    recommendationHitRate: number;
    unresolvedConflicts: number;
  };
  futureScheduleCalendar: ScheduleCalendarDay[];
  unavailableReasonsDistribution: UnavailableReasonItem[];
  conflicts: ScheduleConflict[];
  recommendationHitTrend: HitTrendItem[];
}

export interface Valuation {
  id: number;
  jewelryId: number;
  currentValue: number;
  valuationDate: string;
  valuationAgency: string;
  notes?: string;
  createdAt: string;
  jewelry?: {
    id: number;
    name: string;
    material: string;
  };
}

export interface Insurance {
  id: number;
  jewelryId: number;
  policyNumber: string;
  insuranceCompany: string;
  startDate: string;
  endDate: string;
  insuredAmount: number;
  deductible: number;
  claimsContact: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  jewelry?: {
    id: number;
    name: string;
    material: string;
  };
}

export interface Credential {
  id: number;
  jewelryId: number;
  type: string;
  credentialNumber?: string;
  description?: string;
  fileUrl?: string;
  issueDate?: string;
  issuedBy?: string;
  createdAt: string;
  jewelry?: {
    id: number;
    name: string;
    material: string;
  };
}

export interface MaterialAssetDistribution {
  material: string;
  totalValue: number;
  count: number;
  percentage: number;
}

export interface ExpiringPolicy {
  id: number;
  name: string;
  policyNumber: string;
  insuranceCompany: string;
  endDate: string;
  daysRemaining: number;
}

export interface HighValueHighRiskItem {
  id: number;
  name: string;
  material: string;
  currentValue: number;
  isInsured: boolean;
  riskFactors: string[];
}

export interface ValuationTrendItem {
  period: string;
  totalValue: number;
  jewelryCount: number;
}

export interface AssetStats {
  totalValuation: number;
  materialAssetDistribution: MaterialAssetDistribution[];
  insuranceCoverageRate: number;
  insuredCount: number;
  totalJewelry: number;
  expiringPolicies: ExpiringPolicy[];
  credentialMissingRate: number;
  missingCredentialCount: number;
  highValueHighRisk: HighValueHighRiskItem[];
  valuationTrend: ValuationTrendItem[];
}

export interface UninsuredJewelry {
  id: number;
  name: string;
  material: string;
  currentValuation: number | null;
  purchasePrice: number | null;
  credentialCount: number;
}

export interface ExpiredValuationJewelry {
  id: number;
  name: string;
  material: string;
  lastValuationDate: string | null;
  lastValuationValue: number | null;
}

export interface MissingCredentialJewelry {
  id: number;
  name: string;
  material: string;
  missingTypes: string[];
  existingCredentialTypes: string[];
}

export interface HighValueJewelry {
  id: number;
  name: string;
  material: string;
  currentValue: number;
  isInsured: boolean;
  lastValuationDate: string | null;
}

export interface JewelryAssetInfo {
  jewelryId: number;
  jewelryName: string;
  purchasePrice: number | null;
  invoiceNumber: string | null;
  latestValuation: Valuation | null;
  activeInsurance: Insurance | null;
  credentials: Credential[];
  valuationExpired: boolean;
  credentialCompleteness: number;
  insuranceStatus: string;
}

export type AssetStatusTag = {
  label: string;
  type: 'danger' | 'warning' | 'success' | 'info';
};

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
