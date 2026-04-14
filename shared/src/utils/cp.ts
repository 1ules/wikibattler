import type { Card } from '../types/card.js';
import type { TeamSynergyResult } from '../types/synergy.js';

export function calculateCP(
  cards: Pick<Card, 'attack' | 'health' | 'speed'>[],
  synergyResult: TeamSynergyResult
): number {
  const baseAttack = cards.reduce((s, c) => s + c.attack, 0);
  const baseHealth = cards.reduce((s, c) => s + c.health, 0);
  const baseSpeed  = cards.reduce((s, c) => s + c.speed, 0);

  const { attack: atkMult, health: hpMult, speed: spdMult } = synergyResult.statMultipliers;

  const totalAttack = baseAttack * atkMult;
  const totalHealth = baseHealth * hpMult;
  const totalSpeed  = baseSpeed  * spdMult;

  const baseCP = totalAttack + totalHealth * 0.5 + totalSpeed * 0.3;
  return Math.round(baseCP * synergyResult.cpMultiplier);
}
