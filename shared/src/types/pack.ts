import type { UserCard } from './card.js';

export interface PackState {
  storedPacks: number;
  nextPackAt: string;
  maxPacks: number;
  secondsUntilNext: number;
  /** Total regular packs opened by this user */
  totalOpened: number;
  /** SR/SSR pity packs available to open (1 per 10 regular packs) */
  pitySrAvailable: number;
  /** UR/MR pity packs available to open (1 per 100 regular packs) */
  pityUrAvailable: number;
  /** Progress toward next SR pity pack (0–9) */
  pitySrProgress: number;
  /** Progress toward next UR pity pack (0–99) */
  pityUrProgress: number;
}

export interface PackOpenResult {
  cards: UserCard[];
  packState: PackState;
}
