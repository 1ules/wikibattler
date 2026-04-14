import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { z } from 'zod';
import { startBattle } from './battle.service.js';
import { saveGhostTeam } from './ghost.service.js';
import { AppError } from '../../middleware/errorHandler.js';
import type { Request, Response, NextFunction } from 'express';
import type { BattleMode } from '@wikibattler/shared';

export const battleRouter: ExpressRouter = Router();

const battleSchema = z.object({
  cardIds: z.array(z.string().uuid()).length(5),
  mode: z.enum(['TRAINING', 'CASUAL', 'RANKED', 'RAID']),
});

battleRouter.post('/start', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError(401, 'Unauthorized', 'Authentication required.');
    const { cardIds, mode } = battleSchema.parse(req.body);
    const result = await startBattle(req.user.sub, cardIds, mode as BattleMode);
    res.json({ data: result });
  } catch (e) { next(e); }
});

battleRouter.post('/ghost', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError(401, 'Unauthorized', 'Authentication required.');
    const { cardIds } = z.object({ cardIds: z.array(z.string().uuid()).length(5) }).parse(req.body);
    const ghost = await saveGhostTeam(req.user.sub, cardIds);
    res.json({ data: ghost });
  } catch (e) { next(e); }
});
