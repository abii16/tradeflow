import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { apiClient } from '../lib/apiClient';

export interface RiskZone {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type?: string;
  polygon?: [number, number][];
  lat?: number;
  lng?: number;
  radius?: number;
}

export function useRiskZones() {
  const [riskZones, setRiskZones] = useState<RiskZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchZones = async () => {
      try {
        setIsLoading(true);
        // Fetch risk zones dynamically from the backend endpoint
        const response = await apiClient('/risk-zones');
        
        // Handle various API response formats (direct array or nested in data object)
        const zones = Array.isArray(response) ? response : (response?.data || []);
        
        if (isMounted) {
          setRiskZones(zones);
          setError(null);
        }
      } catch (err: any) {
        console.warn('[RiskZones] Could not load risk zones, map will render without overlays:', err?.message || err);
        if (isMounted) {
          setRiskZones([]);
          setError(null); // Don't surface this error to the user — map works fine without zones
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchZones();

    return () => {
      isMounted = false;
    };
  }, []);

  return { riskZones, isLoading, error };
}
