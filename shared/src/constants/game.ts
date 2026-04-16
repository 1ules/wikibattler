export const MAX_STORED_PACKS = 10;
export const PACK_COOLDOWN_SECONDS = 60;
export const CARDS_PER_PACK = 5;
export const TEAM_SIZE = 5;
export const STARTING_COINS = 100;
export const MAX_STAT_VALUE = 10000;
export const BASE_ELO_RATING = 1000;
export const GUEST_CARD_LIMIT = 50;
export const MARKET_LISTING_DURATION_DAYS = 7;
export const RAID_BOSS_GLOBAL = true;

/** Regular packs opened before awarding one SR/SSR pity pack */
export const PITY_SR_THRESHOLD = 10;
/** Regular packs opened before awarding one UR/MR pity pack */
export const PITY_UR_THRESHOLD = 100;

/**
 * Per-slot rarity drop rates (%) for a regular 5-card pack.
 * Card 1 is almost always Common; card 5 has the best rates.
 */
export type RarityRates = {
  C: number; UC: number; R: number; SR: number; SSR: number; UR: number; MR: number;
};

export const PACK_SLOT_RATES: RarityRates[] = [
  // Slot 1 — near-guaranteed Common
  { C: 99.000, UC: 0.700, R: 0.200, SR: 0.070, SSR: 0.019, UR: 0.010, MR: 0.001 },
  // Slot 2
  { C: 85.000, UC: 10.000, R: 3.000, SR: 1.200, SSR: 0.500, UR: 0.250, MR: 0.050 },
  // Slot 3
  { C: 70.000, UC: 15.000, R: 7.000, SR: 4.000, SSR: 2.000, UR: 1.500, MR: 0.500 },
  // Slot 4
  { C: 55.000, UC: 18.000, R: 10.000, SR: 7.000, SSR: 4.000, UR: 4.000, MR: 2.000 },
  // Slot 5 — best rates
  { C: 40.000, UC: 20.000, R: 15.000, SR: 10.000, SSR: 8.000, UR: 6.000, MR: 1.000 },
];
