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
