import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import { evaluateTeam } from '../synergy/synergy.engine.js';
import { calculateCP } from '@wikibattler/shared';

export async function saveGhostTeam(userId: string, userCardIds: string[]) {
  if (userCardIds.length !== 5) {
    throw new AppError(400, 'BadRequest', 'Team must have exactly 5 cards.');
  }

  const userCards = await prisma.userCard.findMany({
    where: { id: { in: userCardIds }, userId },
    include: { card: true },
  });

  if (userCards.length !== 5) {
    throw new AppError(400, 'BadRequest', 'One or more cards not found in your collection.');
  }

  const cardsForEval = userCards.map(uc => ({
    rarity: uc.card.rarity as any,
    tags: uc.card.tags,
  }));

  const synergyResult = evaluateTeam(cardsForEval);

  const cardsForCP = userCards.map(uc => ({
    attack: uc.card.attack,
    health: uc.card.health,
    speed: uc.card.speed,
  }));
  const cp = calculateCP(cardsForCP, synergyResult);

  // JSON.parse/stringify strips TypeScript types → satisfies Prisma's InputJsonValue
  const snapshot = JSON.parse(JSON.stringify({
    userCards: userCards.map(uc => ({ ...uc, card: uc.card })),
    synergyResult,
  })) as object;

  return prisma.ghostTeam.upsert({
    where: { userId },
    create: { userId, cardIds: userCardIds, cp, snapshot },
    update: { cardIds: userCardIds, cp, snapshot },
  });
}

export async function getRandomGhostOpponent(excludeUserId: string) {
  const count = await prisma.ghostTeam.count({
    where: { userId: { not: excludeUserId } },
  });
  if (count === 0) return null;

  const skip = Math.floor(Math.random() * count);
  const [ghost] = await prisma.ghostTeam.findMany({
    where: { userId: { not: excludeUserId } },
    take: 1,
    skip,
    include: { user: { select: { username: true } } },
  });
  return ghost ?? null;
}
