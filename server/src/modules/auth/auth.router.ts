import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { authLimiter } from '../../middleware/rateLimiter.js';
import {
  postGuest,
  postRegister,
  postLogin,
  postRefresh,
  postUpgrade,
  postLogout,
} from './auth.controller.js';

export const authRouter: ExpressRouter = Router();

authRouter.post('/guest', authLimiter, postGuest);
authRouter.post('/register', authLimiter, postRegister);
authRouter.post('/login', authLimiter, postLogin);
authRouter.post('/refresh', postRefresh);
authRouter.post('/upgrade', requireAuth, postUpgrade);
authRouter.post('/logout', postLogout);
