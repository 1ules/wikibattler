import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { authRouter } from './modules/auth/auth.router.js';
import { cardsRouter } from './modules/cards/cards.router.js';
import { packsRouter } from './modules/packs/packs.router.js';
import { battleRouter } from './modules/battle/battle.router.js';
import { marketplaceRouter } from './modules/marketplace/marketplace.router.js';
import { leaderboardRouter } from './modules/leaderboard/leaderboard.router.js';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  // Hardcode the Vercel frontend + local dev; CLIENT_URL can extend this.
  const allowedOrigins = new Set([
    'https://wikibattler-client.vercel.app',
    'http://localhost:5173',
    env.CLIENT_URL,
  ]);
  app.use(cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.has(origin)) return cb(null, true);
      cb(new Error(`CORS: ${origin} not allowed`));
    },
    credentials: true,
  }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(apiLimiter);

  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.use('/api/auth',        authRouter);
  app.use('/api/cards',       cardsRouter);
  app.use('/api/packs',       packsRouter);
  app.use('/api/battle',      battleRouter);
  app.use('/api/marketplace', marketplaceRouter);
  app.use('/api/leaderboard', leaderboardRouter);

  app.use(errorHandler);

  return app;
}
