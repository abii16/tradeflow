import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';

dotenv.config();

import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 4000;

// Strict CORS whitelist (allow localhost for dev, add prod domains later)
const whitelist = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    if (!origin || whitelist.indexOf(origin) !== -1 || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// Global Rate Limiting: 100 requests per minute
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

import { AuthController } from './auth/auth.controller';
import { loadsRoutes } from './routes/loads.routes';
import { bidsRoutes } from './routes/bids.routes';
import { customsRoutes } from './routes/customs.routes';
import { pricingRoutes } from './routes/pricing.routes';
import { verificationRoutes } from './routes/verification.routes';
import { adminRoutes } from './routes/admin.routes';
import { shipperRoutes } from './routes/shipper.routes';
import { etaRoutes } from './routes/eta.routes';
import { paymentsRoutes } from './routes/payments.routes';
import { offlineSyncRoutes } from './routes/offline-sync.routes';
import { startTtlWorker } from './workers/ttl-expiry.worker';
import { startPayoutWorker } from './workers/payout.worker';
import { SocketGateway } from './gateways/socket.gateway';

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'TradeFlow API Gateway', timestamp: new Date().toISOString() });
});

import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

app.use('/auth', AuthController);
app.use('/api/v1/shipper', JwtAuthGuard, RolesGuard(['SHIPPER']), shipperRoutes);
app.use('/api/v1/loads', JwtAuthGuard, RolesGuard(['SHIPPER', 'TRANSPORTER', 'ADMIN']), loadsRoutes);
app.use('/api/v1/bids', JwtAuthGuard, RolesGuard(['TRANSPORTER', 'SHIPPER', 'ADMIN']), bidsRoutes);
app.use('/api/v1/customs', JwtAuthGuard, RolesGuard(['CUSTOMS_OFFICER', 'FORWARDER', 'ADMIN']), customsRoutes);
app.use('/api/v1/pricing', pricingRoutes); // Route itself checks JWT & Roles inside
app.use('/api/v1/eta', etaRoutes);
app.use('/api/v1/verification', JwtAuthGuard, verificationRoutes);
app.use('/api/v1/admin', JwtAuthGuard, RolesGuard(['ADMIN', 'SYSTEM_ADMIN']), adminRoutes);
app.use('/payments', JwtAuthGuard, RolesGuard(['SHIPPER', 'TRANSPORTER', 'ADMIN']), paymentsRoutes);
app.use('/sync', JwtAuthGuard, offlineSyncRoutes);
app.use('/offline-sync', JwtAuthGuard, offlineSyncRoutes);

startTtlWorker();
startPayoutWorker();

const httpServer = createServer(app);
export const socketGateway = new SocketGateway(httpServer);
(global as any).socketGateway = socketGateway;

httpServer.listen(PORT as number, '0.0.0.0', () => {
  console.log(`Backend API Gateway running on port ${PORT}`);
});
