import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env } from '../../config/env.js';
import { prisma } from '../../config/database.js';
import type { JwtPayload } from '../../middleware/auth.js';

export function signAccessToken(userId: string, isGuest: boolean): string {
  return jwt.sign({ sub: userId, isGuest }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export async function createRefreshToken(userId: string): Promise<string> {
  const raw = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  const family = crypto.randomUUID();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: { userId, tokenHash: hash, family, expiresAt },
  });

  return raw;
}

export async function rotateRefreshToken(
  rawToken: string
): Promise<{ accessToken: string; refreshToken: string; userId: string; isGuest: boolean } | null> {
  const hash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash: hash } });
  if (!existing) return null;

  // Token reuse detected — invalidate entire family
  if (existing.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { family: existing.family },
      data: { revokedAt: new Date() },
    });
    return null;
  }

  if (existing.expiresAt < new Date()) return null;

  // Revoke old token
  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date() },
  });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: existing.userId } });

  // Issue new token in same family
  const newRaw = crypto.randomBytes(32).toString('hex');
  const newHash = crypto.createHash('sha256').update(newRaw).digest('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash: newHash, family: existing.family, expiresAt },
  });

  return {
    accessToken: signAccessToken(user.id, user.isGuest),
    refreshToken: newRaw,
    userId: user.id,
    isGuest: user.isGuest,
  };
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}
