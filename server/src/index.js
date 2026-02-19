import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';
import authRouter from './routes/auth.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'investiq-server', timestamp: new Date().toISOString() });
});

app.use('/auth', authRouter);

// ── Error handler (must be last) ──────────────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`InvestIQ server running on http://localhost:${PORT}`);
});
