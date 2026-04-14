import type { Rarity } from './card.js';

export type SynergyCondition =
  | { type: 'has_tag'; tag: string; minCount: number }
  | { type: 'has_rarity'; rarity: Rarity; minCount: number }
  | { type: 'team_size'; exact: number }
  | { type: 'all_same_tag'; tag: string };

export type SynergyEffect =
  | { type: 'stat_multiply'; stat: 'attack' | 'health' | 'speed' | 'all'; multiplier: number }
  | { type: 'stat_add'; stat: 'attack' | 'health' | 'speed'; flat: number }
  | { type: 'regen'; hpPerTick: number }
  | { type: 'shield'; flatAmount: number }
  | { type: 'cp_multiply'; multiplier: number }
  | { type: 'first_strike' }
  | { type: 'lifesteal'; fraction: number }
  | { type: 'execute_low_hp'; hpThresholdFraction: number }
  | { type: 'aoe_damage'; damagePerTick: number }
  | { type: 'crit_chance'; chance: number }
  | { type: 'coin_gain_per_battle'; amount: number }
  | { type: 'tag_grant'; tag: string };

export type SynergyTier = 'bronze' | 'silver' | 'gold';

export interface SynergyRule {
  id: string;
  name: string;
  description: string;
  tier: SynergyTier;
  conditions: SynergyCondition[];
  conditionMode?: 'all' | 'any';
  effects: SynergyEffect[];
  stackable: boolean;
}

export interface SynergyMatch {
  rule: SynergyRule;
  activationCount: number;
}

export interface TeamSynergyResult {
  matched: SynergyMatch[];
  cpMultiplier: number;
  statMultipliers: {
    attack: number;
    health: number;
    speed: number;
  };
  bonusEffects: SynergyEffect[];
}
