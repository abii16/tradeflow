const API_BASE_URL = 'http://localhost:4000';

export const getAuthToken = () => localStorage.getItem('tradeflow_token');
export const setAuthToken = (token: string) => localStorage.setItem('tradeflow_token', token);
export const removeAuthToken = () => localStorage.removeItem('tradeflow_token');

interface FetchOptions extends RequestInit {
  data?: any;
}

export async function apiClient<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { data, headers: customHeaders, ...customOptions } = options;

  const token = getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method: data ? 'POST' : 'GET',
    headers,
    ...customOptions,
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  let responseData;
  try {
    responseData = await response.json();
  } catch (error) {
    responseData = null;
  }

  if (!response.ok) {
    if (response.status === 401) {
      // Handle unauthorized (e.g., token expired)
      removeAuthToken();
      // Optional: dispatch an event to force logout in UI
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    let errorMessage = responseData?.error || response.statusText;
    if (responseData?.details && Array.isArray(responseData.details)) {
      const detailsText = responseData.details.map((d: any) => d.message).join(', ');
      errorMessage = `${errorMessage}: ${detailsText}`;
    }
    throw new Error(errorMessage);
  }

  return responseData;
}
