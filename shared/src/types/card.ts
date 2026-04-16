import type { QidNode } from './synergy.js';

export type Rarity = 'C' | 'UC' | 'R' | 'SR' | 'SSR' | 'UR' | 'MR';

export interface CardStats {
  attack: number;
  health: number;
  speed: number;
}

export interface Card {
  id: string;
  wikiPageId: number;
  wikiTitle: string;
  wikiSlug: string;
  wikiExtract: string;
  wikiThumbUrl: string | null;
  attack: number;
  health: number;
  speed: number;
  rarity: Rarity;
  wikiQualityScore: number;
  qidChain: QidNode[];
  createdAt: string;
}

export interface UserCard {
  id: string;
  userId: string;
  card: Card;
  acquiredAt: string;
  isFoil: boolean;
  isForSale: boolean;
}
