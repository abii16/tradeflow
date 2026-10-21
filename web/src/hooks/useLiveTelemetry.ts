import { useEffect, useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getAuthToken, apiClient } from '@/lib/apiClient';
import { io, Socket } from 'socket.io-client';

export interface TruckTelemetry {
  id: string;
  shipmentId?: string;
  lat: number;
  lng: number;
  speed: number;
  cargo: string;
  driver: string;
  plate?: string;
  origin?: string;
  destination?: string;
  totalDistanceKm?: number;
  remainingDistanceKm?: number;
  progressPercent?: number;
  eta: string;
  estimatedArrival?: string;
  status?: 'SAFE' | 'GEOFENCE_BREACH' | 'SPEEDING';
  hazardNote?: string;
  weightTons?: number;
  aiConfidence?: string;
  aiModel?: string;
}

export interface RiskAlert {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  radius: number;
  polygon?: [number, number][];
}

export interface TelemetryData {
  trucks: TruckTelemetry[];
  alerts: RiskAlert[];
}

export function useLiveTelemetry() {
  const [telemetry, setTelemetry] = useState<TelemetryData>({ trucks: [], alerts: [] });
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const socketRef = useRef<Socket | null>(null);
  const lastAlertTimeRef = useRef<number>(0);

  const fetchLiveAssets = useCallback(async () => {
    try {
      const response = await apiClient('/telemetry/live-assets');
      if (response && response.trucks) {
        setTelemetry(prev => ({ ...prev, trucks: response.trucks }));
      }
    } catch (error) {
      console.error('Failed to fetch telemetry from server:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const connect = useCallback(() => {
    const token = getAuthToken();
    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:4001';
    
    if (socketRef.current?.connected) {
      return;
    }

    try {
      const socket = io(serverUrl, {
        auth: token ? { token } : {},
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 30000,
        randomizationFactor: 0.5
      });
      
      socketRef.current = socket;

      socket.on('connect', async () => {
        setIsConnected(true);
        socket.emit('join-room', 'general');
        await fetchLiveAssets();
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
      });

      socket.on('eta-updated', (data: any) => {
        if (data.tripId || data.shipmentId) {
          setTelemetry(prev => {
            const newTrucks = prev.trucks.map(truck => {
              if (truck.id === data.tripId || truck.shipmentId === data.shipmentId) {
                return {
                  ...truck,
                  eta: data.predicted_travel_hours ? `${data.predicted_travel_hours.toFixed(1)}h` : truck.eta,
                  estimatedArrival: data.estimatedArrival || truck.estimatedArrival,
                };
              }
              return truck;
            });
            return { ...prev, trucks: newTrucks };
          });
        }
      });

      socket.on('telemetry-update', (data: TruckTelemetry) => {
        setTelemetry(prev => {
          const existingIndex = prev.trucks.findIndex(t => t.id === data.id || t.shipmentId === data.shipmentId);
          const newTrucks = [...prev.trucks];
          
          if (existingIndex >= 0) {
            newTrucks[existingIndex] = { ...newTrucks[existingIndex], ...data };
          } else {
            newTrucks.push(data);
          }
          
          return { ...prev, trucks: newTrucks };
        });
      });

      socket.on('incident-alert', (data: any) => {
        const now = Date.now();
        if (now - lastAlertTimeRef.current > 15000) {
          lastAlertTimeRef.current = now;
          
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.2);
          } catch (err) {
            console.warn("Audio alert failed", err);
          }

          toast.error(`Corridor Incident: ${data.incidentType}`, {
            id: 'critical-geofence-alert',
            position: 'top-right',
            duration: 6000,
            style: {
              background: '#DC2626',
              color: '#fff',
              fontWeight: 'bold',
              border: '1px solid #7F1D1D',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#DC2626',
            },
          });
          
          setTelemetry(prev => ({
            ...prev,
            alerts: [
              ...prev.alerts,
              { 
                id: `inc-${Date.now()}`, 
                title: data.incidentType, 
                description: data.notes || 'Incident reported on corridor route',
                lat: data.latitude || 11.5,
                lng: data.longitude || 42.0,
                radius: 5000
              }
            ]
          }));
        }
      });

    } catch (err) {
      console.error("Failed to initialize Socket.io", err);
    }
  }, [fetchLiveAssets]);

  useEffect(() => {
    connect();
    fetchLiveAssets();

    // Periodic synchronization with real backend and PyTorch AI Engine (every 25 seconds)
    const syncInterval = setInterval(() => {
      fetchLiveAssets();
    }, 25000);

    return () => {
      clearInterval(syncInterval);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [connect, fetchLiveAssets]);

  return { telemetry, isConnected, loading, refreshTelemetry: fetchLiveAssets };
}

