import { scoreToRarity } from '../constants/rarities.js';
import type { Rarity } from '../types/card.js';

export { scoreToRarity };

export function rarityToScore(rarity: Rarity): number {
  const map: Record<Rarity, number> = {
    MR: 100,
    UR: 92,
    SSR: 82,
    SR: 65,
    R: 45,
    UC: 28,
    C: 10,
  };
  return map[rarity];
}
