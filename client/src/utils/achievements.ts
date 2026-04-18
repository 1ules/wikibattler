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

export const ACHIEVEMENTS: Achievement[] = [
  // ── Collection ──────────────────────────────────────────────────────────────
  {
    id: 'first_card',
    name: 'First Article',
    description: 'Add your first card to the collection.',
    category: 'collection', tier: 'bronze',
    condition: { type: 'cards', value: 1 },
    reward: { title: { text: 'Curious Mind', color: '#9ca3af' } },
  },
  {
    id: 'cards_10',
    name: 'Growing Library',
    description: 'Collect 10 cards.',
    category: 'collection', tier: 'bronze',
    condition: { type: 'cards', value: 10 },
    reward: { title: { text: 'Collector', color: '#22c55e' } },
  },
  {
    id: 'cards_50',
    name: 'Half Century',
    description: 'Collect 50 cards.',
    category: 'collection', tier: 'bronze',
    condition: { type: 'cards', value: 50 },
    reward: { subtitle: { text: 'of 50 Articles', color: '#22c55e' } },
  },
  {
    id: 'cards_100',
    name: 'The Hundred',
    description: 'Collect 100 cards.',
    category: 'collection', tier: 'silver',
    condition: { type: 'cards', value: 100 },
    reward: {
      title: { text: 'Centurion', color: '#3b82f6', glow: '#3b82f6' },
      subtitle: { text: 'of 100 Articles' },
    },
  },
  {
    id: 'cards_250',
    name: 'Bibliophile',
    description: 'Collect 250 cards.',
    category: 'collection', tier: 'silver',
    condition: { type: 'cards', value: 250 },
    reward: {
      title: { text: 'Bibliophile', color: '#f97316', glow: '#f97316' },
      background: { id: 'amber-shelf', label: 'Amber Shelf', textured: true },
    },
  },
  {
    id: 'cards_500',
    name: 'Grand Archive',
    description: 'Collect 500 cards.',
    category: 'collection', tier: 'gold',
    condition: { type: 'cards', value: 500 },
    reward: {
      title: { text: 'Archivist', color: '#eab308', glow: '#eab308', animated: 'shimmer' },
      background: { id: 'grand-archive', label: 'Grand Archive', textured: true },
    },
  },
  {
    id: 'cards_1000',
    name: 'Encyclopaedia',
    description: 'Collect 1000 cards.',
    category: 'collection', tier: 'platinum',
    condition: { type: 'cards', value: 1000 },
    reward: {
      title: { text: 'Encyclopaedist', color: '#a855f7', glow: '#a855f7', animated: 'shimmer' },
      subtitle: { text: 'Master of Knowledge', color: '#a855f7' },
      background: { id: 'midnight-library', label: 'Midnight Library', animated: true, textured: true },
    },
  },
  {
    id: 'cards_2500',
    name: 'Living Wikipedia',
    description: 'Collect 2500 cards.',
    category: 'collection', tier: 'mythic',
    condition: { type: 'cards', value: 2500 },
    reward: {
      title: { text: 'Omniscient', color: '#fff', glow: '#c084fc', animated: 'rainbow' },
      subtitle: { text: 'The Living Wikipedia', color: '#c084fc' },
      background: { id: 'cosmos-scroll', label: 'Cosmos Scroll', animated: true, textured: true },
    },
  },

  // ── Rarity ──────────────────────────────────────────────────────────────────
  {
    id: 'first_sr',
    name: 'Rising Star',
    description: 'Obtain your first SR card.',
    category: 'rarity', tier: 'bronze',
    condition: { type: 'srPlus', value: 1 },
    reward: { title: { text: 'Rising Star', color: '#f97316' } },
  },
  {
    id: 'first_ssr',
    name: 'Special Find',
    description: 'Obtain your first SSR card.',
    category: 'rarity', tier: 'silver',
    condition: { type: 'ssrPlus', value: 1 },
    reward: {
      title: { text: 'Special Finder', color: '#ef4444', glow: '#ef4444' },
      subtitle: { text: 'SSR Hunter' },
    },
  },
  {
    id: 'first_ur',
    name: 'Ultra Discovery',
    description: 'Obtain your first UR card.',
    category: 'rarity', tier: 'gold',
    condition: { type: 'urPlus', value: 1 },
    reward: {
      title: { text: 'Gold Seeker', color: '#eab308', glow: '#eab308', animated: 'shimmer' },
      background: { id: 'golden-vault', label: 'Golden Vault' },
    },
  },
  {
    id: 'first_mr',
    name: 'Mythic Touch',
    description: 'Obtain your first MR card.',
    category: 'rarity', tier: 'mythic',
    condition: { type: 'mr', value: 1 },
    reward: {
      title: { text: 'Myth Touched', color: '#a855f7', glow: '#c084fc', animated: 'pulse' },
      subtitle: { text: 'MR Collector', color: '#a855f7' },
      background: { id: 'purple-nebula', label: 'Purple Nebula', animated: true },
    },
  },
  {
    id: 'sr_10',
    name: 'SR Devotee',
    description: 'Collect 10 SR+ cards.',
    category: 'rarity', tier: 'silver',
    condition: { type: 'srPlus', value: 10 },
    reward: { title: { text: 'SR Devotee', color: '#f97316', glow: '#f97316' } },
  },
  {
    id: 'ssr_5',
    name: 'SSR Connoisseur',
    description: 'Collect 5 SSR+ cards.',
    category: 'rarity', tier: 'gold',
    condition: { type: 'ssrPlus', value: 5 },
    reward: {
      title: { text: 'Connoisseur', color: '#ef4444', glow: '#ef4444', animated: 'shimmer' },
      background: { id: 'crimson-glow', label: 'Crimson Glow', animated: true },
    },
  },
  {
    id: 'ur_3',
    name: 'Ultra Triad',
    description: 'Collect 3 UR cards.',
    category: 'rarity', tier: 'platinum',
    condition: { type: 'urPlus', value: 3 },
    reward: {
      title: { text: 'Ultra Collector', color: '#eab308', glow: '#eab308', animated: 'shimmer' },
      subtitle: { text: 'The Golden Few', color: '#eab308' },
      background: { id: 'gilded-throne', label: 'Gilded Throne', textured: true },
    },
  },
  {
    id: 'mr_3',
    name: 'Mythic Trinity',
    description: 'Collect 3 MR cards.',
    category: 'rarity', tier: 'mythic',
    condition: { type: 'mr', value: 3 },
    reward: {
      title: { text: 'Myth Keeper', color: '#fff', glow: '#a855f7', animated: 'rainbow' },
      subtitle: { text: 'Among the Mythic', color: '#c084fc' },
      background: { id: 'void-crystal', label: 'Void Crystal', animated: true, textured: true },
    },
  },
  {
    id: 'all_rarities',
    name: 'Full Spectrum',
    description: 'Own at least one card of every rarity.',
    category: 'rarity', tier: 'gold',
    condition: { type: 'allRarities' },
    reward: {
      title: { text: 'Spectrum Master', color: '#fff', glow: '#a855f7', animated: 'rainbow' },
      background: { id: 'spectrum-waves', label: 'Spectrum Waves', animated: true },
    },
  },
  {
    id: 'rarity_100_any',
    name: 'Dedicated Collector',
    description: 'Collect 100 cards of any single rarity.',
    category: 'rarity', tier: 'silver',
    condition: { type: 'anyRarityCount', value: 100 },
    reward: { title: { text: 'Dedicated', color: '#3b82f6', glow: '#3b82f6' } },
  },

  // ── Packs ────────────────────────────────────────────────────────────────────
  {
    id: 'packs_1',
    name: 'First Opening',
    description: 'Open your first pack.',
    category: 'packs', tier: 'bronze',
    condition: { type: 'packs', value: 1 },
    reward: { subtitle: { text: 'Pack Pioneer' } },
  },
  {
    id: 'packs_10',
    name: 'Pack Addict',
    description: 'Open 10 packs.',
    category: 'packs', tier: 'bronze',
    condition: { type: 'packs', value: 10 },
    reward: { title: { text: 'Pack Addict', color: '#22c55e' } },
  },
  {
    id: 'packs_50',
    name: 'Devoted Opener',
    description: 'Open 50 packs.',
    category: 'packs', tier: 'silver',
    condition: { type: 'packs', value: 50 },
    reward: {
      title: { text: 'Devoted Opener', color: '#3b82f6', glow: '#3b82f6' },
    },
  },
  {
    id: 'packs_100',
    name: 'Century of Packs',
    description: 'Open 100 packs.',
    category: 'packs', tier: 'gold',
    condition: { type: 'packs', value: 100 },
    reward: {
      title: { text: 'Century Opener', color: '#eab308', glow: '#eab308', animated: 'shimmer' },
      background: { id: 'pack-storm', label: 'Pack Storm', animated: true },
    },
  },
  {
    id: 'packs_500',
    name: 'Avalanche',
    description: 'Open 500 packs.',
    category: 'packs', tier: 'platinum',
    condition: { type: 'packs', value: 500 },
    reward: {
      title: { text: 'Avalanche', color: '#a855f7', glow: '#a855f7', animated: 'shimmer' },
      subtitle: { text: '500 Packs Deep', color: '#a855f7' },
      background: { id: 'blizzard-cards', label: 'Blizzard of Cards', animated: true, textured: true },
    },
  },
];
