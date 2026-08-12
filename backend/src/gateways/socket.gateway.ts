import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';

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

      // FR-03: GPS updates that trigger ETA prediction
      socket.on('gps-update', async (payload: any) => {
        try {
          // Send to Python AI Engine
          const response = await fetch('http://127.0.0.1:8000/api/v1/predict-eta/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          
          if (response.ok) {
            const data = await response.json();
            // Broadcast new ETA back to users in the same trip room
            this.emitToRoom(payload.tripId || 'general', 'eta-updated', {
              predicted_travel_hours: data.predicted_travel_hours,
              predicted_eta_minutes: data.predicted_eta_minutes,
              timestamp: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('[Socket.io] Error predicting ETA:', error);
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
