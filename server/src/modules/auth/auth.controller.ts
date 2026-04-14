import type { Request, Response, NextFunction } from 'express';
import { rotateRefreshToken } from './token.service.js';
import {
  createGuestUser,
  loginWithEmail,
  upgradeGuestToEmail,
  registerNewUser,
} from './auth.service.js';
import { loginSchema, registerSchema, upgradeGuestSchema } from './auth.schema.js';
import { AppError } from '../../middleware/errorHandler.js';

const REFRESH_COOKIE = 'wb_refresh';
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: process.env['NODE_ENV'] === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/auth/refresh',
};

export async function postGuest(_req: Request, res: Response, next: NextFunction) {
  try {
    const { accessToken, refreshToken, userId, guestToken } = await createGuestUser();
    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTS);
    res.status(201).json({ data: { accessToken, userId, guestToken } });
  } catch (e) { next(e); }
}

export async function postRegister(req: Request, res: Response, next: NextFunction) {
  try {
    const body = registerSchema.parse(req.body);
    const result = await registerNewUser(body.email, body.password, body.username);
    res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTS);
    res.status(201).json({ data: { accessToken: result.accessToken, userId: result.userId } });
  } catch (e) { next(e); }
}

export async function postLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const body = loginSchema.parse(req.body);
    const result = await loginWithEmail(body.email, body.password);
    res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTS);
    res.json({ data: { accessToken: result.accessToken } });
  } catch (e) { next(e); }
}

export async function postRefresh(req: Request, res: Response, next: NextFunction) {
  try {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!raw) throw new AppError(401, 'Unauthorized', 'No refresh token.');

    const result = await rotateRefreshToken(raw);
    if (!result) throw new AppError(401, 'Unauthorized', 'Invalid or expired refresh token.');

    res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTS);
    res.json({ data: { accessToken: result.accessToken } });
  } catch (e) { next(e); }
}

export async function postUpgrade(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError(401, 'Unauthorized', 'Authentication required.');
    if (!req.user.isGuest) throw new AppError(400, 'BadRequest', 'Account already registered.');

    const body = upgradeGuestSchema.parse(req.body);
    const result = await upgradeGuestToEmail(req.user.sub, body.email, body.password, body.username);
    res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTS);
    res.json({ data: { accessToken: result.accessToken } });
  } catch (e) { next(e); }
}

export async function postLogout(req: Request, res: Response, next: NextFunction) {
  try {
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth/refresh' });
    res.json({ data: { ok: true } });
  } catch (e) { next(e); }
}
