export interface Jewelry {
  id: number;
  name: string;
  material: string;
  color: string;
  purchaseDate: string;
  storageLocation: string;
  suitableScenarios: string;
  imageUrl?: string;
  createdAt: string;
  outfits?: Outfit[];
  maintenances?: Maintenance[];
  repairs?: Repair[];
  lendings?: Lending[];
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
