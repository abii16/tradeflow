import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

import { AuthController } from './auth/auth.controller';
import { loadsRoutes } from './routes/loads.routes';
import { startTtlWorker } from './workers/ttl-expiry.worker';

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'TradeFlow API Gateway', timestamp: new Date().toISOString() });
});

app.use('/auth', AuthController);
app.use('/loads', loadsRoutes);

startTtlWorker();

app.listen(PORT, () => {
  console.log(`Backend API Gateway running on port ${PORT}`);
});
