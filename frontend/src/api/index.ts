import axios from 'axios';
import type { Jewelry, Outfit, Maintenance, Repair, AllStats, RiskAssessment, RiskStats } from '../types';

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
};
