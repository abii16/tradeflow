import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

import { AuthController } from './auth/auth.controller';
import { loadsRoutes } from './routes/loads.routes';
import { bidsRoutes } from './routes/bids.routes';
import { customsRoutes } from './routes/customs.routes';
import { pricingRoutes } from './routes/pricing.routes';
import { verificationRoutes } from './routes/verification.routes';
import { adminRoutes } from './routes/admin.routes';
import { paymentsRoutes } from './routes/payments.routes';
import { offlineSyncRoutes } from './routes/offline-sync.routes';
import { startTtlWorker } from './workers/ttl-expiry.worker';
import { startPayoutWorker } from './workers/payout.worker';
import { SocketGateway } from './gateways/socket.gateway';

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'TradeFlow API Gateway', timestamp: new Date().toISOString() });
});

app.use('/auth', AuthController);
app.use('/loads', loadsRoutes);
app.use('/bids', bidsRoutes);
app.use('/customs', customsRoutes);
app.use('/pricing', pricingRoutes);
app.use('/verification', verificationRoutes);
app.use('/admin', adminRoutes);
app.use('/payments', paymentsRoutes);
app.use('/sync', offlineSyncRoutes);
app.use('/offline-sync', offlineSyncRoutes);

startTtlWorker();
startPayoutWorker();

const httpServer = createServer(app);
export const socketGateway = new SocketGateway(httpServer);
(global as any).socketGateway = socketGateway;

httpServer.listen(PORT, () => {
  console.log(`Backend API Gateway running on port ${PORT}`);
});
