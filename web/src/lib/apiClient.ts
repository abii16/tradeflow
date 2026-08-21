import { supabase } from './supabase';
import axios, { AxiosRequestConfig } from 'axios';

const API_BASE_URL = 'http://localhost:4001/api/v1';

// Keep these for backward compatibility during transition if any other files use them
export const getAuthToken = () => localStorage.getItem('tradeflow_token');
export const setAuthToken = (token: string) => localStorage.setItem('tradeflow_token', token);
export const removeAuthToken = () => localStorage.removeItem('tradeflow_token');

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

axiosInstance.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response?.status === 401) {
    removeAuthToken();
    window.dispatchEvent(new Event('auth:unauthorized'));
  }
  
  let errorMessage = error.response?.data?.error || error.response?.statusText || error.message;
  if (error.response?.data?.details && Array.isArray(error.response.data.details)) {
    const detailsText = error.response.data.details.map((d: any) => d.message).join(', ');
    errorMessage = `${errorMessage}: ${detailsText}`;
  }
  return Promise.reject(new Error(errorMessage));
});

interface FetchOptions extends AxiosRequestConfig {}

export async function apiClient<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { data, headers, ...customOptions } = options;
  const method = data ? 'POST' : (options.method || 'GET');

  // Fetch the latest session securely from Supabase
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || getAuthToken();

  const finalHeaders = {
    ...headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
  
  const response = await axiosInstance({
    url: endpoint,
    method,
    data,
    headers: finalHeaders,
    ...customOptions
  });
  
  return response.data;
}

export async function fetchRiskZones() {
  return apiClient('/security/geofences', { method: 'GET' });
}

export async function broadcastRiskZone(data: any) {
  return apiClient('/security/broadcast-geofence', { method: 'POST', data });
}

export async function resolveRiskZone(id: string) {
  return apiClient(`/security/geofences/${id}/resolve`, { method: 'PATCH' });
}

export async function fetchSecurityHistory() {
  return apiClient('/security/history', { method: 'GET' });
}

// Verification Queue (Tab 2)
export async function getPendingVerifications() {
  return apiClient('/admin/verifications/pending', { method: 'GET' });
}

export async function reviewVerification(id: string, data: { status: string; rejectionReason?: string }) {
  return apiClient(`/admin/verifications/${id}/review`, { method: 'POST', data });
}

export async function submitVerification(data: { tradeLicenseNumber: string; taxId: string; documentUrls?: string[] }) {
  return apiClient('/verification/submit', { method: 'POST', data });
}

// Telematics (Tab 1)
export async function fetchCorridorSummary() {
  return apiClient('/admin/telematics/corridor-summary', { method: 'GET' });
}

export async function fetchLiveAssets() {
  return apiClient('/admin/telematics/live-assets', { method: 'GET' });
}

export async function fetchCorridorRoutes() {
  return apiClient('/pricing/corridor-routes', { method: 'GET' });
}

export async function fetchEtaProjections() {
  return apiClient('/eta/projections', { method: 'GET' });
}

export async function recalculateYield() {
  return apiClient('/pricing/recalculate-yield', { method: 'POST' });
}

// Dynamic Pricing (Tab 3)
export async function fetchPricingGovernance() {
  return apiClient('/pricing/governance', { method: 'GET' });
}

export async function updatePricingGovernance(data: any) {
  return apiClient('/pricing/governance/update', { method: 'POST', data });
}

export async function publishRates() {
  return apiClient('/pricing/publish-rates', { method: 'POST' });
}

// Fuel Analytics (Tab 4)
export async function fetchFuelAnalytics() {
  return apiClient('/admin/analytics/fuel', { method: 'GET' });
}

export async function exportFuelReport() {
  return apiClient('/admin/analytics/fuel/export', { method: 'POST' });
}

// Disputes & Audit (Tab 6)
export async function fetchDisputes() {
  return apiClient('/admin/disputes', { method: 'GET' });
}

export async function resolveDispute(id: string, data: any) {
  return apiClient(`/admin/disputes/${id}/resolve`, { method: 'POST', data });
}

export async function fetchAuditLogs(filter?: any) {
  return apiClient('/admin/audit-logs', { method: 'GET', params: filter });
}

export async function exportAuditLogs(format: 'csv' | 'pdf') {
  return apiClient('/admin/audit-logs/export', { method: 'POST', data: { format } });
}
