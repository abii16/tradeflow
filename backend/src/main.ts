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
import { startTtlWorker } from './workers/ttl-expiry.worker';
import { SocketGateway } from './gateways/socket.gateway';

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'TradeFlow API Gateway', timestamp: new Date().toISOString() });
});

app.use('/auth', AuthController);
app.use('/loads', loadsRoutes);
app.use('/bids', bidsRoutes);
app.use('/customs', customsRoutes);
app.use('/pricing', pricingRoutes);

startTtlWorker();

const httpServer = createServer(app);
export const socketGateway = new SocketGateway(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Backend API Gateway running on port ${PORT}`);
});
