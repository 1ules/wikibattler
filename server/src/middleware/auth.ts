import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './errorHandler.js';

export interface JwtPayload {
  sub: string;
  isGuest: boolean;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

function extractToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) throw new AppError(401, 'Unauthorized', 'Authentication required.');

  try {
    req.user = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    next();
  } catch {
    throw new AppError(401, 'Unauthorized', 'Invalid or expired token.');
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (token) {
    try {
      req.user = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    } catch {
      // ignore — treat as unauthenticated
    }
  }
  next();
}

export function requireRegistered(req: Request, _res: Response, next: NextFunction): void {
  requireAuth(req, _res, () => {
    if (req.user?.isGuest) {
      throw new AppError(403, 'Forbidden', 'This action requires a registered account.');
    }
    next();
  });
}
