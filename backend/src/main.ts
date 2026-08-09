import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'TradeFlow API Gateway', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend API Gateway running on port ${PORT}`);
});
