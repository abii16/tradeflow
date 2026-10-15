import { supabase } from './supabase';
import axios, { AxiosRequestConfig } from 'axios';

const API_BASE_URL = 'http://localhost:4001/api/v1';

// Keep these for backward compatibility during transition if any other files use them
export const isRememberMe = (): boolean => {
  return localStorage.getItem('tradeflow_remember_me') === 'true';
};

export const getAuthToken = (): string | null => {
  return sessionStorage.getItem('tradeflow_token') || localStorage.getItem('tradeflow_token');
};

export const getRefreshToken = (): string | null => {
  return sessionStorage.getItem('tradeflow_refresh_token') || localStorage.getItem('tradeflow_refresh_token');
};

export const setAuthToken = (token: string, rememberMe?: boolean) => {
  const shouldRemember = rememberMe !== undefined ? rememberMe : isRememberMe();
  if (shouldRemember) {
    localStorage.setItem('tradeflow_token', token);
    sessionStorage.removeItem('tradeflow_token');
  } else {
    sessionStorage.setItem('tradeflow_token', token);
    localStorage.removeItem('tradeflow_token');
  }
};

export const setRefreshToken = (token: string, rememberMe?: boolean) => {
  const shouldRemember = rememberMe !== undefined ? rememberMe : isRememberMe();
  if (shouldRemember) {
    localStorage.setItem('tradeflow_refresh_token', token);
    sessionStorage.removeItem('tradeflow_refresh_token');
  } else {
    sessionStorage.setItem('tradeflow_refresh_token', token);
    localStorage.removeItem('tradeflow_refresh_token');
  }
};

export const setAuthStorage = (accessToken: string, refreshToken: string, rememberMe: boolean = false) => {
  localStorage.setItem('tradeflow_remember_me', rememberMe ? 'true' : 'false');
  setAuthToken(accessToken, rememberMe);
  setRefreshToken(refreshToken, rememberMe);
};

export const removeAuthToken = () => {
  localStorage.removeItem('tradeflow_token');
  sessionStorage.removeItem('tradeflow_token');
  localStorage.removeItem('tradeflow_refresh_token');
  sessionStorage.removeItem('tradeflow_refresh_token');
  localStorage.removeItem('tradeflow_remember_me');
};

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
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    config.headers['x-refresh-token'] = refreshToken;
  }
  return config;
}, (error) => Promise.reject(error));

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    // INSA Requirement 3: Silent refresh rotation when short-lived access token expires
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const storedRefreshToken = session?.refresh_token || getRefreshToken();
        if (storedRefreshToken) {
          const refreshRes = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken: storedRefreshToken,
          });
          if (refreshRes.data?.access_token) {
            const newToken = refreshRes.data.access_token;
            setAuthToken(newToken);
            if (refreshRes.data.refresh_token) {
              setRefreshToken(refreshRes.data.refresh_token);
            }
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axiosInstance(originalRequest);
          }
        }
      } catch (refreshErr) {
        removeAuthToken();
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }

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
  }
);


interface FetchOptions extends AxiosRequestConfig { }

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
  return apiClient('/admin/security/geofences', { method: 'GET' });
}

export async function broadcastRiskZone(data: any) {
  return apiClient('/admin/security/broadcast-geofence', { method: 'POST', data });
}

export async function resolveRiskZone(id: string) {
  return apiClient(`/admin/security/geofences/${id}/resolve`, { method: 'PATCH' });
}

export async function fetchSecurityHistory() {
  return apiClient('/admin/security/history', { method: 'GET' });
}

// Verification Queue (Tab 2)
export async function getAllVerifications() {
  return apiClient('/admin/verifications', { method: 'GET' });
}

export async function reviewVerification(id: string, data: { status: string; rejectionReason?: string }) {
  return apiClient(`/admin/verifications/${id}/review`, { method: 'POST', data });
}

export async function submitVerification(data: { tradeLicenseNumber: string; taxId: string; documentUrls?: any }) {
  return apiClient('/verification/submit', { method: 'POST', data });
}

export async function getVerificationStatus() {
  return apiClient('/verification/status', { method: 'GET' });
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
  return apiClient('/admin/pricing/optimize', { method: 'POST' });
}

// Dynamic Pricing (Tab 3)
export async function fetchPricingGovernance() {
  return apiClient('/admin/pricing/corridor-rates', { method: 'GET' });
}

export async function updatePricingGovernance(data: any) {
  return apiClient('/pricing/governance/update', { method: 'POST', data });
}

export async function publishRates(data: any) {
  return apiClient('/admin/pricing/publish', { method: 'POST', data });
}

// Fuel Analytics (Tab 4)
export async function fetchFuelAnalytics(timeframe?: string) {
  const query = timeframe ? `?timeframe=${encodeURIComponent(timeframe)}` : '';
  return apiClient(`/admin/analytics/fuel${query}`, { method: 'GET' });
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

// ==========================================
// FINANCIAL DASHBOARD APIs
// ==========================================

export async function fetchPayments(query: any = {}) {
  return apiClient('/payments', { method: 'GET', params: query });
}

export async function calculateSpotRate(data: any) {
  return apiClient('/pricing/quote', { method: 'POST', data });
}

export async function processBatchPayouts(batchSize: number = 20) {
  return apiClient('/payments/payouts/process-batch', { method: 'POST', data: { batchSize } });
}

export async function refundPayment(id: string, reason: string) {
  return apiClient(`/payments/${id}/refund`, { method: 'POST', data: { reason } });
}

// ==========================================
// SHIPPER PORTAL APIs
// ==========================================

export async function postLoad(data: any) {
  return apiClient('/loads', { method: 'POST', data });
}

export async function getAllLoads() {
  return apiClient('/loads', { method: 'GET' });
}

export async function getShipperActiveShipment() {
  return apiClient('/shipper/shipments/active', { method: 'GET' });
}

export async function getShipperLoads() {
  return apiClient('/shipper/loads', { method: 'GET' });
}

export async function acceptBidEscrow(bidId: string) {
  return apiClient(`/shipper/bids/${bidId}/accept-escrow`, { method: 'POST' });
}

export async function getContractRates() {
  return apiClient('/shipper/contract-rates', { method: 'GET' });
}

export async function createContractRate(data: any) {
  return apiClient('/shipper/contract-rates', { method: 'POST', data });
}

export async function renegotiateContract(id: string) {
  return apiClient(`/shipper/contract-rates/${id}/renegotiate`, { method: 'POST' });
}

export async function getCustomsDocuments(shipmentId: string) {
  return apiClient(`/customs/shipments/${shipmentId}/documents`, { method: 'GET' });
}

export async function uploadCustomsDocument(data: FormData) {
  return apiClient('/customs/upload', {
    method: 'POST',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

export async function getShipperOrganization() {
  return apiClient('/shipper/organization', { method: 'GET' });
}

export async function updateShipperOrganization(data: any) {
  return apiClient('/shipper/organization', { method: 'PUT', data });
}

export async function getCustomsQueue() {
  return apiClient('/customs/queue', { method: 'GET' });
}

export async function getCustomsInspections() {
  return apiClient('/customs/inspections', { method: 'GET' });
}


export async function updateCustomsStatus(id: string, status: string, rejectionReason?: string) {
  return apiClient('/customs/' + id + '/status', { method: 'PATCH', data: { status, rejectionReason } });
}

export async function completeUserProfile(data: any) {
  return apiClient('/auth/complete-profile', { method: 'POST', data });
}

export async function getAllCorridorUsers(params?: { role?: string; status?: string; search?: string }) {
  const query = new URLSearchParams();
  if (params?.role) query.append('role', params.role);
  if (params?.status) query.append('status', params.status);
  if (params?.search) query.append('search', params.search);
  const qStr = query.toString() ? `?${query.toString()}` : '';
  return apiClient(`/admin/users${qStr}`, { method: 'GET' });
}

export async function updateUserStatus(id: string, status: string, reason?: string) {
  return apiClient(`/admin/users/${id}/status`, { method: 'PATCH', data: { status, reason } });
}

export async function updateUserRole(id: string, role: string, reason?: string) {
  return apiClient(`/admin/users/${id}/role`, { method: 'PATCH', data: { role, reason } });
}

export async function getUserDossier(id: string) {
  return apiClient(`/admin/users/${id}`, { method: 'GET' });
}

export interface UserSession {
  id: string;
  device: string;
  browser: string;
  os: string;
  ipAddress: string;
  location: string;
  isCurrent: boolean;
  isSuspicious: boolean;
  suspiciousReason: string | null;
  lastActive: string;
  createdAt: string;
}

export async function getUserSessions(): Promise<{ sessions: UserSession[] }> {
  return apiClient('/auth/sessions', { method: 'GET' });
}

export async function revokeUserSession(sessionId: string): Promise<{ success: boolean; message: string }> {
  return apiClient(`/auth/sessions/${sessionId}`, { method: 'DELETE' });
}

export async function revokeOtherUserSessions(): Promise<{ success: boolean; message: string }> {
  return apiClient('/auth/sessions/other', { method: 'DELETE' });
}

// ==========================================
// CARRIER / TRANSPORTER PORTAL APIS (SRS COMPLIANT)
// ==========================================

export async function getCarrierOverview() {
  return apiClient('/carrier/overview', { method: 'GET' });
}

export async function getCarrierLoads() {
  return apiClient('/carrier/available-loads', { method: 'GET' });
}

export async function getCarrierMyBids() {
  return apiClient('/carrier/my-bids', { method: 'GET' });
}

export async function submitCarrierBid(data: { loadId: string; bidAmount: number; deliveryEta?: string; notes?: string }) {
  return apiClient('/carrier/bids', { method: 'POST', data });
}

export async function withdrawCarrierBid(bidId: string) {
  return apiClient(`/carrier/bids/${bidId}/withdraw`, { method: 'POST' });
}

export async function getCarrierHauls() {
  return apiClient('/carrier/hauls', { method: 'GET' });
}

export async function updateHaulStatus(haulId: string, status: string, currentLat?: number, currentLng?: number) {
  return apiClient(`/carrier/hauls/${haulId}/status`, { method: 'PATCH', data: { status, currentLat, currentLng } });
}

export async function submitHaulCheckin(haulId: string, data: { lat: number; lng: number; speed?: number; waypointName?: string; notes?: string }) {
  return apiClient(`/carrier/hauls/${haulId}/checkin`, { method: 'POST', data });
}

export async function submitProofOfDelivery(haulId: string, data: { podPhotoUrl?: string; podSignatureUrl?: string; notes?: string }) {
  return apiClient(`/carrier/hauls/${haulId}/pod`, { method: 'POST', data });
}

export async function getHaulEta(haulId: string) {
  return apiClient(`/carrier/hauls/${haulId}/eta`, { method: 'GET' });
}

export async function getCarrierVehicles() {
  return apiClient('/carrier/vehicles', { method: 'GET' });
}

export async function addCarrierVehicle(data: { vehicleType: string; capacityTons: number | string; fuelType?: string; insuranceDocUrl?: string; roadworthinessDocUrl?: string }) {
  return apiClient('/carrier/vehicles', { method: 'POST', data });
}

export async function deleteCarrierVehicle(vehicleId: string) {
  return apiClient(`/carrier/vehicles/${vehicleId}`, { method: 'DELETE' });
}

export async function getCarrierDrivers() {
  return apiClient('/carrier/drivers', { method: 'GET' });
}

export async function getCarrierPerformance() {
  return apiClient('/carrier/performance', { method: 'GET' });
}

export async function getCarrierPayouts() {
  return apiClient('/carrier/payouts', { method: 'GET' });
}

export async function reportCarrierIncident(data: { shipmentId?: string; incidentType: string; latitude: number; longitude: number; severity?: string; notes?: string }) {
  return apiClient('/carrier/incidents', { method: 'POST', data });
}

export async function getRiskZones() {
  return apiClient('/risk-zones', { method: 'GET' });
}

export async function optimizeCarrierRoute(data: {
  currentLat: number;
  currentLng: number;
  destinationLat: number;
  destinationLng: number;
  vehicleWeight?: number;
  fuelLevel?: number;
}) {
  return apiClient('/carrier/optimize-route', { method: 'POST', data });
}

export async function disputePayment(paymentId: string, reason: string, evidenceUrl?: string) {
  return apiClient(`/payments/${paymentId}/dispute`, { method: 'POST', data: { reason, evidenceUrl } });
}

export async function syncOfflineQueueBatch(items: any[]) {
  const checkIns = items
    .filter((i) => i.type === 'CHECKIN')
    .map((i) => ({
      shipmentId: i.payload.shipmentId || '00000000-0000-0000-0000-000000000000',
      latitude: i.payload.lat,
      longitude: i.payload.lng,
      speedKmH: i.payload.speed || 60,
      timestamp: i.payload.timestamp || new Date().toISOString(),
    }));

  const incidentsList = items
    .filter((i) => i.type === 'INCIDENT')
    .map((i) => ({
      shipmentId: i.payload.shipmentId,
      incidentType: i.payload.incidentType || 'CHECKPOINT_DELAY',
      severity: i.payload.severity || 'MEDIUM',
      latitude: i.payload.latitude || 11.43,
      longitude: i.payload.longitude || 40.8,
      notes: i.payload.notes || 'Offline queued incident',
      timestamp: i.payload.timestamp || new Date().toISOString(),
    }));

  return apiClient('/sync/batch', {
    method: 'POST',
    data: {
      checkIns,
      incidents: incidentsList,
    },
  });
}

// ==========================================
// FORWARDER PORTAL APIS (SRS COMPLIANT)
// ==========================================

export async function getForwarderWorkspace() {
  return apiClient('/forwarder/workspace', { method: 'GET' });
}

export async function getForwarderManifests() {
  return apiClient('/forwarder/manifests', { method: 'GET' });
}

export async function validateForwarderDocument(data: {
  documentUrl: string;
  expectedQuantity: number;
  expectedValue?: number;
  documentType?: string;
  loadId?: string;
}) {
  return apiClient('/forwarder/manifests/validate', { method: 'POST', data });
}

export async function getForwarderBiddingExchange() {
  return apiClient('/forwarder/bidding-exchange', { method: 'GET' });
}

export async function awardForwarderBid(bidId: string, driverId?: string) {
  return apiClient('/forwarder/award-bid', { method: 'POST', data: { bidId, driverId } });
}

export async function getForwarderAnalytics() {
  return apiClient('/forwarder/analytics', { method: 'GET' });
}


