import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { getState, postOpen, postOpenPity } from './packs.controller.js';

export const packsRouter: ExpressRouter = Router();

packsRouter.get('/state',      requireAuth, getState);
packsRouter.post('/open',      requireAuth, postOpen);
packsRouter.post('/open-pity', requireAuth, postOpenPity);
