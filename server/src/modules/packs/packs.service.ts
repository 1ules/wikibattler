import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import { generateSlotCard, generatePityCard } from '../wikipedia/card-factory.js';
import {
  MAX_STORED_PACKS,
  PACK_COOLDOWN_SECONDS,
  CARDS_PER_PACK,
  PITY_SR_THRESHOLD,
  PITY_UR_THRESHOLD,
} from '@wikibattler/shared';
import type { PackState, Rarity } from '@wikibattler/shared';

// ─── PackState DTO ────────────────────────────────────────────────────────────

export function toPackStateDto(
  stored: number,
  nextPackAt: Date,
  totalOpened: number,
  pitySrAvailable: number,
  pityUrAvailable: number
): PackState {
  const secondsUntilNext = Math.max(
    0,
    Math.ceil((nextPackAt.getTime() - Date.now()) / 1000)
  );
  return {
    storedPacks: stored,
    nextPackAt: nextPackAt.toISOString(),
    maxPacks: MAX_STORED_PACKS,
    secondsUntilNext,
    totalOpened,
    pitySrAvailable,
    pityUrAvailable,
    pitySrProgress: totalOpened % PITY_SR_THRESHOLD,
    pityUrProgress: totalOpened % PITY_UR_THRESHOLD,
  };
}

// ─── Lazy accumulation ────────────────────────────────────────────────────────

function computePackAccumulation(
  storedPacks: number,
  nextPackAt: Date
): { storedPacks: number; nextPackAt: Date } {
  const now = Date.now();
  const next = nextPackAt.getTime();
  if (now < next) return { storedPacks, nextPackAt };

  const elapsed = now - next;
  const newPacks = Math.floor(elapsed / (PACK_COOLDOWN_SECONDS * 1000)) + 1;
  const newStored = Math.min(storedPacks + newPacks, MAX_STORED_PACKS);
  const newNextPackAt = new Date(next + newPacks * PACK_COOLDOWN_SECONDS * 1000);
  return { storedPacks: newStored, nextPackAt: newNextPackAt };
}

// ─── Get state ────────────────────────────────────────────────────────────────

export async function getPackState(userId: string): Promise<PackState> {
  let state = await prisma.packState.findUnique({ where: { userId } });

  if (!state) {
    state = await prisma.packState.create({
      data: {
        userId,
        storedPacks: 1,
        nextPackAt: new Date(Date.now() + PACK_COOLDOWN_SECONDS * 1000),
        totalOpened: 0,
        pitySrAvailable: 0,
        pityUrAvailable: 0,
      },
    });
  }

  const computed = computePackAccumulation(state.storedPacks, state.nextPackAt);
  if (
    computed.storedPacks !== state.storedPacks ||
    computed.nextPackAt.getTime() !== state.nextPackAt.getTime()
  ) {
    await prisma.packState.update({
      where: { userId },
      data: { storedPacks: computed.storedPacks, nextPackAt: computed.nextPackAt },
    });
  }

  return toPackStateDto(
    computed.storedPacks,
    computed.nextPackAt,
    state.totalOpened,
    state.pitySrAvailable,
    state.pityUrAvailable
  );
}

// ─── Open regular pack ────────────────────────────────────────────────────────

export async function openPack(userId: string) {
  const state = await prisma.packState.findUnique({ where: { userId } });
  if (!state) throw new AppError(404, 'NotFound', 'Pack state not found.');

  const computed = computePackAccumulation(state.storedPacks, state.nextPackAt);
  if (computed.storedPacks < 1) {
    throw new AppError(409, 'Conflict', 'No packs available.');
  }

  // Generate 5 cards, each using slot-specific rarity rates
  const cardDataArray = await Promise.all(
    Array.from({ length: CARDS_PER_PACK }, (_, i) => generateSlotCard(i))
  );

  const newTotalOpened = state.totalOpened + 1;

  // Determine pity awards: how many new thresholds crossed
  const prevSrCrossings = Math.floor(state.totalOpened / PITY_SR_THRESHOLD);
  const newSrCrossings  = Math.floor(newTotalOpened   / PITY_SR_THRESHOLD);
  const pitySrGained    = newSrCrossings - prevSrCrossings;

  const prevUrCrossings = Math.floor(state.totalOpened / PITY_UR_THRESHOLD);
  const newUrCrossings  = Math.floor(newTotalOpened   / PITY_UR_THRESHOLD);
  const pityUrGained    = newUrCrossings - prevUrCrossings;

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
        totalOpened: newTotalOpened,
        pitySrAvailable: { increment: pitySrGained },
        pityUrAvailable: { increment: pityUrGained },
      },
    });

    return results;
  });

  const newState = await getPackState(userId);
  return {
    cards: userCards,
    packState: newState,
    pitySrGained,
    pityUrGained,
  };
}

// ─── Open pity pack ───────────────────────────────────────────────────────────

export type PityTier = 'SR' | 'UR';

export async function openPityPack(userId: string, tier: PityTier) {
  const state = await prisma.packState.findUnique({ where: { userId } });
  if (!state) throw new AppError(404, 'NotFound', 'Pack state not found.');

  if (tier === 'SR') {
    if (state.pitySrAvailable < 1) {
      throw new AppError(409, 'Conflict', 'No SR pity packs available.');
    }
  } else {
    if (state.pityUrAvailable < 1) {
      throw new AppError(409, 'Conflict', 'No UR pity packs available.');
    }
  }

  // 50/50 coin flip for the forced rarity
  const rarity: Rarity = tier === 'SR'
    ? (Math.random() < 0.5 ? 'SR' : 'SSR')
    : (Math.random() < 0.5 ? 'UR' : 'MR');

  const cardData = await generatePityCard(rarity);

  const userCard = await prisma.$transaction(async (tx) => {
    let card = await tx.card.findUnique({ where: { wikiPageId: cardData.wikiPageId } });
    if (!card) {
      card = await tx.card.create({ data: cardData });
    }
    const isFoil = rarity === 'SSR' || rarity === 'MR';
    const uc = await tx.userCard.create({
      data: { userId, cardId: card.id, isFoil },
      include: { card: true },
    });

    await tx.packState.update({
      where: { userId },
      data: tier === 'SR'
        ? { pitySrAvailable: { decrement: 1 } }
        : { pityUrAvailable: { decrement: 1 } },
    });

    return uc;
  });

  const newState = await getPackState(userId);
  return { card: userCard, packState: newState };
}
