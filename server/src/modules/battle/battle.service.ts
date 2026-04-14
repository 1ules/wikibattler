import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import { simulateBattle } from './battle.simulator.js';
import { saveGhostTeam, getRandomGhostOpponent } from './ghost.service.js';
import { evaluateTeam } from '../synergy/synergy.engine.js';
import { calculateCP } from '@wikibattler/shared';
import type { BattleMode } from '@wikibattler/shared';

const CASUAL_COIN_WIN  = 50;
const CASUAL_COIN_LOSS = 10;
const RATED_WIN_DELTA  = 25;
const RATED_LOSS_DELTA = -20;

export async function startBattle(
  userId: string,
  userCardIds: string[],
  mode: BattleMode
) {
  if (userCardIds.length !== 5) {
    throw new AppError(400, 'BadRequest', 'Team must have exactly 5 cards.');
  }

  const userCards = await prisma.userCard.findMany({
    where: { id: { in: userCardIds }, userId },
    include: { card: true },
  });
  if (userCards.length !== 5) {
    throw new AppError(400, 'BadRequest', 'One or more cards not found.');
  }

  // Build attacker team
  const atkCardsForEval = userCards.map(uc => ({
    rarity: uc.card.rarity as any,
    tags:   uc.card.tags,
    attack: uc.card.attack,
    health: uc.card.health,
    speed:  uc.card.speed,
  }));
  const atkSynergy = evaluateTeam(atkCardsForEval);
  const cpAttacker = calculateCP(atkCardsForEval, atkSynergy);

  // Get defender
  const ghost = mode !== 'TRAINING' ? await getRandomGhostOpponent(userId) : null;
  const defCards = ghost
    ? (ghost.snapshot as { userCards: { card: { attack: number; health: number; speed: number; rarity: string; tags: string[] } }[] }).userCards.map(uc => uc.card)
    : generateBotTeam(cpAttacker);

  const defCardsForEval = defCards.map(c => ({
    rarity: c.rarity as any,
    tags:   c.tags,
    attack: c.attack,
    health: c.health,
    speed:  c.speed,
  }));
  const defSynergy = evaluateTeam(defCardsForEval);
  const cpDefender = calculateCP(defCardsForEval, defSynergy);

  const combatLog = simulateBattle(
    { cards: atkCardsForEval },
    { cards: defCardsForEval }
  );

  const won = combatLog.winner === 'attacker';

  let coinsEarned = 0;
  let ratingDelta: number | null = null;

  if (mode === 'CASUAL') {
    coinsEarned = won ? CASUAL_COIN_WIN : CASUAL_COIN_LOSS;
  } else if (mode === 'RANKED') {
    ratingDelta = won ? RATED_WIN_DELTA : RATED_LOSS_DELTA;
    coinsEarned = won ? CASUAL_COIN_WIN * 2 : CASUAL_COIN_LOSS;
  }

  if (coinsEarned > 0 || ratingDelta !== null) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        coins: { increment: coinsEarned },
        ...(ratingDelta !== null ? { rating: { increment: ratingDelta } } : {}),
      },
    });
  }

  const battle = await prisma.battle.create({
    data: {
      mode,
      userId,
      defenderGhostId: ghost?.id ?? null,
      winnerId: won ? userId : (ghost?.userId ?? null),
      combatLog: JSON.parse(JSON.stringify(combatLog)) as object,
      cpAttacker,
      cpDefender,
      coinsEarned,
      ratingDelta,
    },
  });

  return { battle, combatLog, coinsEarned, ratingDelta, cpAttacker, cpDefender };
}

function generateBotTeam(targetCp: number) {
  const cardCp = Math.round(targetCp / 5);
  return Array.from({ length: 5 }, (_, i) => ({
    attack: Math.round(cardCp * 0.3),
    health: Math.round(cardCp * 0.5),
    speed:  Math.round(cardCp * 0.2),
    rarity: 'C' as const,
    tags:   [] as string[],
  }));
}
