import { useEffect, useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getAuthToken } from '../lib/apiClient';

export interface TruckTelemetry {
  id: string;
  lat: number;
  lng: number;
  speed: number;
  cargo: string;
  driver: string;
  eta: string;
  status?: 'SAFE' | 'GEOFENCE_BREACH' | 'SPEEDING';
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

const MAX_RECONNECT_ATTEMPTS = 10;
const MAX_BACKOFF_MS = 30000; // Cap backoff at 30 seconds

/**
 * Custom hook to manage a resilient WebSocket connection for live telemetry.
 * Implements exponential backoff with jitter to handle thundering herd problems
 * during high availability scale-ups (10,000+ concurrent connections).
 */
export function useLiveTelemetry() {
  const [telemetry, setTelemetry] = useState<TelemetryData>({ trucks: [], alerts: [] });
  const [isConnected, setIsConnected] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const lastAlertTimeRef = useRef<number>(0);

  const connect = useCallback(() => {
    const token = getAuthToken();
    const baseUrl = import.meta.env.VITE_WS_TELEMATICS_URL || 'ws://localhost:8000/ws/telematics';
    const wsUrl = token ? `${baseUrl}?token=${token}` : baseUrl;
    
    // Prevent multiple parallel connections
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    try {
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        reconnectAttempts.current = 0; // Reset on successful connection
        
        // Fallback static data if backend is offline or empty initially
        setTelemetry({
          trucks: [
            { id: 'ET-9021', lat: 11.652, lng: 42.493, speed: 64, cargo: '30T Rebar', driver: 'Yared Tekle', eta: '6.2h', status: 'SAFE' },
            { id: 'ET-7734', lat: 8.751, lng: 39.524, speed: 45, cargo: 'Medical Supplies', driver: 'Amanuel D.', eta: '1.5h', status: 'GEOFENCE_BREACH' }
          ],
          alerts: [
            { id: 'RISK-04', title: 'radar_risk_04_title', description: 'radar_risk_04_desc', lat: 11.794, lng: 41.008, radius: 25000 }
          ]
        });
      };

      socket.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        
        // Exponential backoff with jitter (avoids thundering herd)
        const backoff = Math.min(1000 * Math.pow(2, reconnectAttempts.current), MAX_BACKOFF_MS);
        const jitter = Math.random() * 500;
        const delay = backoff + jitter;
        
        console.log(`[WebSocket] Reconnecting in ${Math.round(delay)}ms... (Attempt ${reconnectAttempts.current + 1})`);
        
        reconnectTimeoutRef.current = window.setTimeout(() => {
          reconnectAttempts.current += 1;
          connect();
        }, delay);
      };

      socket.onerror = (error) => {
        // Log errors to monitoring service in production
        console.error("WebSocket encountered an error:", error);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // REAL-TIME AUDIO ALERTS & TOAST NOTIFICATIONS (FR-08 / NFR)
          if (data.alert_triggered) {
            const now = Date.now();
            if (now - lastAlertTimeRef.current > 15000) { // Throttle to max once per 15 seconds
              lastAlertTimeRef.current = now;
              
              try {
                // Trigger a subtle browser audio beep using AudioContext
                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); // Subtle volume
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.2); // 200ms duration
              } catch (err) {
                console.warn("Audio alert failed", err);
              }

              // Display high-priority red Toast Notification
              toast.error(data.alert_message || "CRITICAL: Security Alert or Geofence Breach Detected!", {
                id: 'critical-geofence-alert', // Prevents toast stacking
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
            }
          }
          
          // Clean state management: batched updates for performance
          if (data.type === 'telemetry_update') {
            setTelemetry(prev => ({
              ...prev,
              ...(data.payload || {})
            }));
          } else if (data.type === 'truck_update') {
            const truck = data.payload as TruckTelemetry;
            setTelemetry(prev => {
              const existingIndex = prev.trucks.findIndex(t => t.id === truck.id);
              if (existingIndex >= 0) {
                const newTrucks = [...prev.trucks];
                newTrucks[existingIndex] = truck;
                return { ...prev, trucks: newTrucks };
              } else {
                return { ...prev, trucks: [...prev.trucks, truck] };
              }
            });
          }
        } catch (err) {
          console.error("Failed to parse telemetry websocket message", err);
        }
      };
    } catch (err) {
      console.error("Failed to initialize WebSocket", err);
    }
  }, []);

  useEffect(() => {
    connect();

    // Cleanup phase: close socket and clear pending timeouts to prevent memory leaks
    return () => {
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { telemetry, isConnected };
}
