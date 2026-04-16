// Types
export type { Card, UserCard, CardStats, Rarity } from './types/card.js';
export type { User, GuestUser, AuthUser, PublicProfile } from './types/user.js';
export type { PackState, PackOpenResult } from './types/pack.js';
export type {
  SynergyRule,
  SynergyCondition,
  SynergyEffect,
  SynergyTier,
  SynergyMatch,
  TeamSynergyResult,
} from './types/synergy.js';
export type {
  BattleMode,
  TeamSnapshot,
  CombatTick,
  CombatEvent,
  CombatLog,
  BattleResult,
} from './types/battle.js';
export type { ApiResponse, ApiError, PaginatedResponse } from './types/api.js';

// Constants
export {
  RARITY_SCORE_THRESHOLDS,
  RARITY_MULTIPLIERS,
  RARITY_DISPLAY,
  RARITY_ORDER,
  scoreToRarity,
} from './constants/rarities.js';
export {
  MAX_STORED_PACKS,
  PACK_COOLDOWN_SECONDS,
  CARDS_PER_PACK,
  TEAM_SIZE,
  STARTING_COINS,
  MAX_STAT_VALUE,
  BASE_ELO_RATING,
  GUEST_CARD_LIMIT,
  MARKET_LISTING_DURATION_DAYS,
  PITY_SR_THRESHOLD,
  PITY_UR_THRESHOLD,
  PACK_SLOT_RATES,
} from './constants/game.js';
export type { RarityRates } from './constants/game.js';
export { SYNERGY_RULES } from './constants/synergy-rules.js';
export { CATEGORY_TAG_RULES, categoriesToTags } from './constants/category-tag-map.js';

// Utils
export { calculateCP } from './utils/cp.js';
export { scoreToRarity as rarityFromScore, rarityToScore } from './utils/rarity.js';
export { normalizeWikiTitle, wikiTitleToSlug } from './utils/slug.js';
