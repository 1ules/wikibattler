import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import { generateRandomCard } from '../wikipedia/card-factory.js';
import {
  MAX_STORED_PACKS,
  PACK_COOLDOWN_SECONDS,
  CARDS_PER_PACK,
  RARITY_DISPLAY,
} from '@wikibattler/shared';
import type { PackState } from '@wikibattler/shared';

export function computePackState(
  storedPacks: number,
  nextPackAt: Date,
  totalOpened: number
): { storedPacks: number; nextPackAt: Date; totalOpened: number } {
  const now = Date.now();
  const next = nextPackAt.getTime();

  if (now < next) {
    return { storedPacks, nextPackAt, totalOpened };
  }

  const elapsed = now - next;
  const newPacks = Math.floor(elapsed / (PACK_COOLDOWN_SECONDS * 1000)) + 1;
  const added = Math.min(newPacks, MAX_STORED_PACKS - storedPacks);
  const newStored = Math.min(storedPacks + newPacks, MAX_STORED_PACKS);
  const newNextPackAt = new Date(next + (newPacks) * PACK_COOLDOWN_SECONDS * 1000);

  return {
    storedPacks: newStored,
    nextPackAt: newNextPackAt,
    totalOpened,
  };
}

export function toPackStateDto(stored: number, nextPackAt: Date): PackState {
  const secondsUntilNext = Math.max(
    0,
    Math.ceil((nextPackAt.getTime() - Date.now()) / 1000)
  );
  return {
    storedPacks: stored,
    nextPackAt: nextPackAt.toISOString(),
    maxPacks: MAX_STORED_PACKS,
    secondsUntilNext,
  };
}

export async function getPackState(userId: string): Promise<PackState> {
  let state = await prisma.packState.findUnique({ where: { userId } });

  if (!state) {
    state = await prisma.packState.create({
      data: {
        userId,
        storedPacks: 1,
        nextPackAt: new Date(Date.now() + PACK_COOLDOWN_SECONDS * 1000),
        totalOpened: 0,
      },
    });
  }

  const computed = computePackState(state.storedPacks, state.nextPackAt, state.totalOpened);

  if (computed.storedPacks !== state.storedPacks || computed.nextPackAt.getTime() !== state.nextPackAt.getTime()) {
    await prisma.packState.update({
      where: { userId },
      data: {
        storedPacks: computed.storedPacks,
        nextPackAt: computed.nextPackAt,
      },
    });
  }

  return toPackStateDto(computed.storedPacks, computed.nextPackAt);
}

export async function openPack(userId: string) {
  let state = await prisma.packState.findUnique({ where: { userId } });
  if (!state) throw new AppError(404, 'NotFound', 'Pack state not found.');

  const computed = computePackState(state.storedPacks, state.nextPackAt, state.totalOpened);

  if (computed.storedPacks < 1) {
    throw new AppError(409, 'Conflict', 'No packs available.');
  }

  // Generate 5 cards in parallel
  const cardDataArray = await Promise.all(
    Array.from({ length: CARDS_PER_PACK }, () => generateRandomCard())
  );

  // Upsert cards and create UserCards in a transaction
  const userCards = await prisma.$transaction(async (tx) => {
    const results = [];

    for (const cardData of cardDataArray) {
      let card = await tx.card.findUnique({ where: { wikiPageId: cardData.wikiPageId } });

      if (!card) {
        card = await tx.card.create({ data: cardData });
      }

      const isFoil = cardData.rarity === 'SSR' || cardData.rarity === 'MR';

      const userCard = await tx.userCard.create({
        data: { userId, cardId: card.id, isFoil },
        include: { card: true },
      });
      results.push(userCard);
    }

    await tx.packState.update({
      where: { userId },
      data: {
        storedPacks: computed.storedPacks - 1,
        nextPackAt: computed.nextPackAt,
        totalOpened: { increment: 1 },
      },
    });

    return results;
  });

  const newState = await getPackState(userId);
  return { cards: userCards, packState: newState };
}
