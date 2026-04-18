export type AchievementCategory = 'collection' | 'rarity' | 'foil' | 'packs' | 'diversity' | 'special';
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'mythic';

export interface RewardTitle {
  text: string;
  color?: string;
  glow?: string;
  animated?: 'shimmer' | 'rainbow' | 'pulse';
}

export interface RewardSubtitle {
  text: string;
  color?: string;
}

export interface RewardBackground {
  id: string;
  label: string;
  animated?: boolean;
  textured?: boolean;
}

export interface AchievementReward {
  title?: RewardTitle;
  subtitle?: RewardSubtitle;
  background?: RewardBackground;
}

export interface AchievementCondition {
  type:
    | 'cards'
    | 'rarityMin'
    | 'foilTotal'
    | 'foilSrPlus'
    | 'foilSsrPlus'
    | 'foilUrPlus'
    | 'foilMr'
    | 'foilAllSrPlus'
    | 'packs'
    | 'uniqueTraits'
    | 'srPlus'
    | 'ssrPlus'
    | 'urPlus'
    | 'mr'
    | 'allRarities'
    | 'pityClaimed'
    | 'maxStoredPacks'
    | 'anyRarityCount';
  value?: number;
  rarity?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  condition: AchievementCondition;
  reward: AchievementReward;
}

export interface CollectionStats {
  totalCards: number;
  byRarity: Record<string, number>;
  foilTotal: number;
  foilByRarity: Record<string, number>;
  uniqueTraits: number;
  srPlus: number;
  ssrPlus: number;
  urPlus: number;
  mrCount: number;
  hasAllRarities: boolean;
  packsOpened: number;
  pityClaimed: boolean;
  hadMaxStoredPacks: boolean;
  hasFoilSrPlus: boolean;
  hasFoilSsrPlus: boolean;
  hasFoilUrPlus: boolean;
  hasFoilMr: boolean;
  hasFoilAllSrPlus: boolean;
}
