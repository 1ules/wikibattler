import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { prisma } from '../../config/database.js';
import type { Request, Response, NextFunction } from 'express';

export const leaderboardRouter: ExpressRouter = Router();

leaderboardRouter.get('/ranked', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const players = await prisma.user.findMany({
      where: { isGuest: false, username: { not: null } },
      select: { id: true, username: true, rating: true, avatarUrl: true },
      orderBy: { rating: 'desc' },
      take: 100,
    });
    res.json({ data: players });
  } catch (e) { next(e); }
});
