import axios, { AxiosRequestConfig } from 'axios';

const API_BASE_URL = 'http://localhost:4001';

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
  
  const response = await axiosInstance({
    url: endpoint,
    method,
    data,
    headers,
    ...customOptions
  });
  
  return response.data;
}

export async function fetchRiskZones() {
  return apiClient('/risk-zones', { method: 'GET' });
}
