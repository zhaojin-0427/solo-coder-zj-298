import axios from 'axios';
import type {
  Jewelry,
  Outfit,
  Maintenance,
  Repair,
  AllStats,
  RiskAssessment,
  RiskStats,
  Lending,
  LendingStats,
  JewelryRecommendation,
  WearPlanDetail,
  WearPlanSummary,
  ScheduleConflict,
  ScheduleStats,
  FutureJewelryPlan,
  Valuation,
  Insurance,
  Credential,
  AssetStats,
  UninsuredJewelry,
  ExpiredValuationJewelry,
  MissingCredentialJewelry,
  HighValueJewelry,
  JewelryAssetInfo,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const jewelryApi = {
  list: () => api.get<Jewelry[]>('/jewelry').then((r) => r.data),
  detail: (id: number) => api.get<Jewelry>(`/jewelry/${id}`).then((r) => r.data),
  create: (data: Partial<Jewelry>) => api.post<Jewelry>('/jewelry', data).then((r) => r.data),
  update: (id: number, data: Partial<Jewelry>) =>
    api.put<Jewelry>(`/jewelry/${id}`, data).then((r) => r.data),
  delete: (id: number) => api.delete(`/jewelry/${id}`).then((r) => r.data),
  getRisk: (id: number) => api.get<RiskAssessment>(`/jewelry/${id}/risk`).then((r) => r.data),
  getAllRisk: () => api.get<RiskAssessment[]>('/jewelry/risk/all').then((r) => r.data),
  getRiskStats: () => api.get<RiskStats>('/jewelry/risk/stats').then((r) => r.data),
  getFuturePlans: (id: number) =>
    api.get<FutureJewelryPlan[]>(`/schedule/jewelry/${id}/future`).then((r) => r.data),
};

export const outfitApi = {
  list: (jewelryId?: number) =>
    api.get<Outfit[]>('/outfits', { params: { jewelryId } }).then((r) => r.data),
  create: (data: Partial<Outfit>) => api.post<Outfit>('/outfits', data).then((r) => r.data),
  delete: (id: number) => api.delete(`/outfits/${id}`).then((r) => r.data),
};

export const maintenanceApi = {
  list: (jewelryId?: number) =>
    api.get<Maintenance[]>('/maintenances', { params: { jewelryId } }).then((r) => r.data),
  create: (data: Partial<Maintenance>) =>
    api.post<Maintenance>('/maintenances', data).then((r) => r.data),
  delete: (id: number) => api.delete(`/maintenances/${id}`).then((r) => r.data),
};

export const repairApi = {
  list: (jewelryId?: number, status?: string) =>
    api.get<Repair[]>('/repairs', { params: { jewelryId, status } }).then((r) => r.data),
  create: (data: Partial<Repair>) => api.post<Repair>('/repairs', data).then((r) => r.data),
  update: (id: number, data: Partial<Repair>) =>
    api.put<Repair>(`/repairs/${id}`, data).then((r) => r.data),
  delete: (id: number) => api.delete(`/repairs/${id}`).then((r) => r.data),
};

export const statsApi = {
  all: (days = 30) => api.get<AllStats>('/stats', { params: { days } }).then((r) => r.data),
  lending: () => api.get<LendingStats>('/stats/lending').then((r) => r.data),
  schedule: (days = 30) => api.get<ScheduleStats>('/stats/schedule', { params: { days } }).then((r) => r.data),
};

export const lendingApi = {
  list: (params?: { status?: string; jewelryId?: number }) =>
    api.get<Lending[]>('/lendings', { params }).then((r) => r.data),
  detail: (id: number) => api.get<Lending>(`/lendings/${id}`).then((r) => r.data),
  create: (data: Partial<Lending>) => api.post<Lending>('/lendings', data).then((r) => r.data),
  returnJewelry: (id: number, data: Partial<Lending>) =>
    api.put<Lending>(`/lendings/${id}/return`, data).then((r) => r.data),
  checkOverdue: () => api.get('/lendings/overdue-check').then((r) => r.data),
  delete: (id: number) => api.delete(`/lendings/${id}`).then((r) => r.data),
};

export const scheduleApi = {
  recommend: (params: {
    jewelryIds: number[];
    planDate: string;
    scenario: string;
    outfitTags: string;
    priority?: number;
  }) => api.post<JewelryRecommendation[]>('/schedule/recommend', params).then((r) => r.data),

  createPlan: (data: {
    planDate: string;
    scenario: string;
    outfitTags: string;
    candidateJewelryIds: number[];
    priority?: number;
    forbiddenConditions?: string;
    notes?: string;
  }) => api.post<WearPlanDetail>('/schedule', data).then((r) => r.data),

  listPlans: (params?: { status?: string; fromDate?: string; toDate?: string }) =>
    api.get<WearPlanSummary[]>('/schedule', { params }).then((r) => r.data),

  getConflicts: () => api.get<ScheduleConflict[]>('/schedule/conflicts').then((r) => r.data),

  getPlanDetail: (id: number) => api.get<WearPlanDetail>(`/schedule/${id}`).then((r) => r.data),

  confirmPlan: (id: number, selectedJewelryIds: number[]) =>
    api.put<WearPlanDetail>(`/schedule/${id}/confirm`, { selectedJewelryIds }).then((r) => r.data),

  resolveConflict: (planId: number, jewelryId: number, newJewelryId: number, notes?: string) =>
    api
      .put<WearPlanDetail>(`/schedule/${planId}/resolve-conflict/${jewelryId}`, { newJewelryId, notes })
      .then((r) => r.data),

  deletePlan: (id: number) => api.delete(`/schedule/${id}`).then((r) => r.data),
};

export const assetApi = {
  getValuations: (jewelryId?: number) =>
    api.get<Valuation[]>('/asset/valuations', { params: { jewelryId } }).then((r) => r.data),
  createValuation: (data: Partial<Valuation> & { jewelryId: number; currentValue: number; valuationDate: string; valuationAgency: string }) =>
    api.post<Valuation>('/asset/valuations', data).then((r) => r.data),
  deleteValuation: (id: number) => api.delete(`/asset/valuations/${id}`).then((r) => r.data),

  getInsurances: (jewelryId?: number) =>
    api.get<Insurance[]>('/asset/insurances', { params: { jewelryId } }).then((r) => r.data),
  createInsurance: (data: Partial<Insurance> & { jewelryId: number; policyNumber: string; insuranceCompany: string; startDate: string; endDate: string; insuredAmount: number; claimsContact: string }) =>
    api.post<Insurance>('/asset/insurances', data).then((r) => r.data),
  updateInsurance: (id: number, data: Partial<Insurance>) =>
    api.put<Insurance>(`/asset/insurances/${id}`, data).then((r) => r.data),
  renewInsurance: (id: number, data: { policyNumber: string; insuranceCompany: string; startDate: string; endDate: string; insuredAmount: number; deductible?: number; claimsContact?: string; notes?: string }) =>
    api.post<Insurance>(`/asset/insurances/${id}/renew`, data).then((r) => r.data),
  deleteInsurance: (id: number) => api.delete(`/asset/insurances/${id}`).then((r) => r.data),

  getCredentials: (jewelryId?: number) =>
    api.get<Credential[]>('/asset/credentials', { params: { jewelryId } }).then((r) => r.data),
  createCredential: (data: Partial<Credential> & { jewelryId: number; type: string }) =>
    api.post<Credential>('/asset/credentials', data).then((r) => r.data),
  updateCredential: (id: number, data: Partial<Credential>) =>
    api.put<Credential>(`/asset/credentials/${id}`, data).then((r) => r.data),
  deleteCredential: (id: number) => api.delete(`/asset/credentials/${id}`).then((r) => r.data),

  getUninsured: () => api.get<UninsuredJewelry[]>('/asset/uninsured').then((r) => r.data),
  getExpiringPolicies: (days?: number) =>
    api.get<Insurance[]>('/asset/expiring-policies', { params: { days } }).then((r) => r.data),
  getExpiredValuations: (days?: number) =>
    api.get<ExpiredValuationJewelry[]>('/asset/expired-valuations', { params: { days } }).then((r) => r.data),
  getMissingCredentials: () => api.get<MissingCredentialJewelry[]>('/asset/missing-credentials').then((r) => r.data),
  getHighValue: (threshold?: number) =>
    api.get<HighValueJewelry[]>('/asset/high-value', { params: { threshold } }).then((r) => r.data),
  getStats: () => api.get<AssetStats>('/asset/stats').then((r) => r.data),
  getJewelryAssetInfo: (id: number) => api.get<JewelryAssetInfo>(`/asset/jewelry/${id}`).then((r) => r.data),
};
