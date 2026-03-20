import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { configureCors } from './middleware/cors';
import authRoutes from './routes/auth';
import identityRoutes from './routes/identity';
import verifyRoutes from './routes/verify';
import statsRoutes from './routes/stats';
import faucetRoutes from './routes/faucet';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Security middleware
app.use(helmet());

// CORS
app.use(configureCors());

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'satsid-backend',
    version: '1.0.0',
    network: process.env.STACKS_NETWORK || 'testnet',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/identity', identityRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/faucet', faucetRoutes);

// Alias: /api/leaderboard -> /api/stats/leaderboard
app.use('/api/leaderboard', (req, res, next) => {
  req.url = '/leaderboard' + req.url;
  statsRoutes(req, res, next);
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found.`,
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);

  // CORS errors
  if (err.message === 'Not allowed by CORS') {
    res.status(403).json({
      error: 'Forbidden',
      message: 'CORS policy does not allow this origin.',
    });
    return;
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred.',
  });
});

// Start server (only if not in test mode)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`SatsID Backend API running on port ${PORT}`);
    console.log(`Network: ${process.env.STACKS_NETWORK || 'testnet'}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
}

export default app;
