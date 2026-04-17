import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import { signAccessToken, createRefreshToken } from './token.service.js';
import { STARTING_COINS } from '@wikibattler/shared';
import { PACK_COOLDOWN_SECONDS } from '@wikibattler/shared';

export async function createGuestUser(): Promise<{
  accessToken: string;
  refreshToken: string;
  userId: string;
  guestToken: string;
}> {
  const guestToken = uuidv4();

  const user = await prisma.user.create({
    data: {
      isGuest: true,
      guestToken,
      coins: STARTING_COINS,
      packState: {
        create: {
          storedPacks: 1,
          nextPackAt: new Date(Date.now() + PACK_COOLDOWN_SECONDS * 1000),
          totalOpened: 0,
        },
      },
    },
  });

  const accessToken = signAccessToken(user.id, true);
  const refreshToken = await createRefreshToken(user.id);

  return { accessToken, refreshToken, userId: user.id, guestToken };
}

export async function loginWithEmail(
  email: string,
  password: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    throw new AppError(401, 'Unauthorized', 'Invalid email or password.');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError(401, 'Unauthorized', 'Invalid email or password.');

  return {
    accessToken: signAccessToken(user.id, false),
    refreshToken: await createRefreshToken(user.id),
  };
}

export async function upgradeGuestToEmail(
  userId: string,
  email: string,
  password: string,
  username: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing && existing.id !== userId) {
    throw new AppError(409, 'Conflict', 'Email or username already taken.');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id: userId },
    data: {
      isGuest: false,
      email,
      passwordHash,
      username,
      guestToken: null,
    },
  });

  // Revoke all old refresh tokens
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  return {
    accessToken: signAccessToken(userId, false),
    refreshToken: await createRefreshToken(userId),
  };
}

export async function getCurrentUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isGuest: true, username: true, coins: true, rating: true },
  });
}

export async function registerNewUser(
  email: string,
  password: string,
  username: string
): Promise<{ accessToken: string; refreshToken: string; userId: string }> {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) throw new AppError(409, 'Conflict', 'Email or username already taken.');

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      isGuest: false,
      email,
      passwordHash,
      username,
      coins: STARTING_COINS,
      packState: {
        create: {
          storedPacks: 1,
          nextPackAt: new Date(Date.now() + PACK_COOLDOWN_SECONDS * 1000),
        },
      },
    },
  });

  return {
    accessToken: signAccessToken(user.id, false),
    refreshToken: await createRefreshToken(user.id),
    userId: user.id,
  };
}
