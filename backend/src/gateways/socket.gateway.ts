import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { db } from '../db';
import { incidents } from '../db/schema/incidents';

export class SocketGateway {
  private io: Server;

  constructor(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: '*', // Allows all origins for development
        methods: ['GET', 'POST'],
      },
    });

    this.setupListeners();
  }

  private setupListeners() {
    // Middleware for Socket Authentication could go here
    /*
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      // verify token...
      next();
    });
    */

    this.io.on('connection', (socket: Socket) => {
      console.log(`[Socket.io] Client connected: ${socket.id}`);

      // General room joining logic (e.g., listening to updates for a specific loadId)
      socket.on('join-room', (roomId: string) => {
        socket.join(roomId);
        console.log(`[Socket.io] Client ${socket.id} joined room ${roomId}`);
      });

      // General room leaving logic
      socket.on('leave-room', (roomId: string) => {
        socket.leave(roomId);
        console.log(`[Socket.io] Client ${socket.id} left room ${roomId}`);
      });

      // FR-03 & FR-05.3: GPS updates that trigger ETA prediction and Mid-trip Rerouting
      socket.on('gps-update', async (payload: any) => {
        try {
          // NFR 5.1: Enforce <5s latency using concurrent execution (Promise.all) and a 4000ms timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);

          const [etaResponse, optimizeResponse] = await Promise.all([
            fetch('http://127.0.0.1:8000/api/v1/predict-eta/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
              signal: controller.signal
            }).catch(e => null),

            fetch('http://127.0.0.1:8000/api/v1/route/optimize', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                current_lat: payload.latitude,
                current_lng: payload.longitude,
                destination_lat: payload.destination_lat,
                destination_lng: payload.destination_lng,
                vehicle_weight: payload.vehicle_weight || 10.0,
                fuel_level: payload.fuel_level || 50.0
              }),
              signal: controller.signal
            }).catch(e => null)
          ]);
          clearTimeout(timeoutId);

          if (etaResponse?.ok) {
            const data = await etaResponse.json();
            // Broadcast new ETA back to users in the same trip room
            this.emitToRoom(payload.tripId || 'general', 'eta-updated', {
              predicted_travel_hours: data.predicted_travel_hours,
              predicted_eta_minutes: data.predicted_eta_minutes,
              timestamp: new Date().toISOString()
            });
          }

          if (optimizeResponse?.ok) {
            const routeData = await optimizeResponse.json();
            if (routeData.better_route_found && routeData.cost_savings_percentage > 5.0) {
              // Propose reroute to driver (requires confirmation)
              this.emitToRoom(payload.tripId || 'general', 'propose-reroute', routeData);
            }
          }
        } catch (error) {
          console.error('[Socket.io] Error in GPS update flow:', error);
        }
      });

      // FR-05.2: Incident Logging (Accident, Checkpoint, Fuel Unavailability)
      socket.on('report-incident', async (payload: any) => {
        try {
          console.log(`[Socket.io] Incident reported: ${payload.incidentType}`);
          
          // 1. Save to Database
          await db.insert(incidents).values({
            shipmentId: payload.shipmentId,
            reporterId: payload.reporterId,
            incidentType: payload.incidentType,
            latitude: payload.latitude,
            longitude: payload.longitude,
            severity: payload.severity || 'MEDIUM',
            notes: payload.notes,
            // NFR 5.2: Authoritative timestamp from the driver's device (offline queuing support)
            reportedAt: new Date(payload.reportedAt || Date.now())
          });

          // 2. Notify AI Engine to update routing model in near-real time
          await fetch('http://127.0.0.1:8000/api/v1/route/incident', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          // 3. Broadcast to dispatchers/room
          this.emitToRoom(payload.tripId || 'general', 'incident-alert', payload);
        } catch (error) {
          console.error('[Socket.io] Error reporting incident:', error);
        }
      });

      // FR-03: Trip completed, trigger retraining logic
      socket.on('trip-completed', async (tripPayload: any) => {
        try {
          // Append to Python AI Engine retraining buffer
          const response = await fetch('http://127.0.0.1:8000/api/v1/predict-eta/retrain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              trips: [tripPayload],
              force_retrain: tripPayload.force_retrain || false
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log(`[Socket.io] Retrain buffer status: ${data.message} (Buffered: ${data.trips_buffered})`);
          }
        } catch (error) {
          console.error('[Socket.io] Error sending trip to retrain API:', error);
        }
      });

      socket.on('disconnect', () => {
        console.log(`[Socket.io] Client disconnected: ${socket.id}`);
      });
    });
  }

  /**
   * Emit an event to all clients in a specific room
   */
  public emitToRoom(roomId: string, event: string, payload: any) {
    this.io.to(roomId).emit(event, payload);
  }

  /**
   * Broadcast an event to all connected clients
   */
  public broadcast(event: string, payload: any) {
    this.io.emit(event, payload);
  }
}
