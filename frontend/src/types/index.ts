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

export interface IdleJewelry {
  id: number;
  name: string;
  material: string;
  lastWearDate: string | null;
  totalWears: number;
  idleDays: number;
}

export interface AllStats {
  overview: StatsOverview;
  materialWearFrequency: MaterialFrequency[];
  problemDistribution: ProblemDistribution[];
  topOutfitCombinations: OutfitCombination[];
  longIdleJewelry: IdleJewelry[];
}
