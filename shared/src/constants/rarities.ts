import type { Rarity } from '../types/card.js';

export const RARITY_SCORE_THRESHOLDS: Record<Rarity, number> = {
  MR: 100,
  UR: 90,
  SSR: 80,
  SR: 60,
  R: 35,
  UC: 20,
  C: 0,
};

export const RARITY_MULTIPLIERS: Record<Rarity, number> = {
  C: 1.0,
  UC: 1.2,
  R: 1.5,
  SR: 2.0,
  SSR: 3.0,
  UR: 5.0,
  MR: 10.0,
};

export const RARITY_DISPLAY: Record<Rarity, { label: string; color: string; foil: boolean; glow: boolean }> = {
  C:   { label: 'Common',           color: '#9ca3af', foil: false, glow: false },
  UC:  { label: 'Uncommon',         color: '#22c55e', foil: false, glow: false },
  R:   { label: 'Rare',             color: '#3b82f6', foil: false, glow: false },
  SR:  { label: 'Super Rare',       color: '#f97316', foil: false, glow: false },
  SSR: { label: 'Super Special Rare', color: '#ef4444', foil: true,  glow: false },
  UR:  { label: 'Ultra Rare',       color: '#eab308', foil: false, glow: false },
  MR:  { label: 'Mythic Rare',      color: '#a855f7', foil: true,  glow: true  },
};

export const RARITY_ORDER: Rarity[] = ['C', 'UC', 'R', 'SR', 'SSR', 'UR', 'MR'];

export function scoreToRarity(qualityScore: number): Rarity {
  if (qualityScore >= 100) return 'MR';
  if (qualityScore >= 90)  return 'UR';
  if (qualityScore >= 80)  return 'SSR';
  if (qualityScore >= 60)  return 'SR';
  if (qualityScore >= 35)  return 'R';
  if (qualityScore >= 20)  return 'UC';
  return 'C';
}
