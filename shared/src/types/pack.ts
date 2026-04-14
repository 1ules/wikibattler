import type { UserCard } from './card.js';

export interface PackState {
  storedPacks: number;
  nextPackAt: string;
  maxPacks: number;
  secondsUntilNext: number;
}

export interface PackOpenResult {
  cards: UserCard[];
  packState: PackState;
}
