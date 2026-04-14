import {
  SYNERGY_RULES,
  RARITY_ORDER,
} from '@wikibattler/shared';
import type {
  SynergyRule,
  SynergyCondition,
  TeamSynergyResult,
  SynergyMatch,
  SynergyEffect,
} from '@wikibattler/shared';
import type { Rarity } from '@wikibattler/shared';

interface CardForEval {
  rarity: Rarity;
  tags: string[];
}

function rarityRank(r: Rarity): number {
  return RARITY_ORDER.indexOf(r);
}

function meetsCondition(condition: SynergyCondition, cards: CardForEval[]): boolean {
  switch (condition.type) {
    case 'has_tag': {
      const count = cards.filter(c => c.tags.includes(condition.tag)).length;
      return count >= condition.minCount;
    }
    case 'has_rarity': {
      const minRank = rarityRank(condition.rarity);
      const count = cards.filter(c => rarityRank(c.rarity) >= minRank).length;
      return count >= condition.minCount;
    }
    case 'team_size': {
      return cards.length === condition.exact;
    }
    case 'all_same_tag': {
      return cards.every(c => c.tags.includes(condition.tag));
    }
    default:
      return false;
  }
}

function ruleMatches(rule: SynergyRule, cards: CardForEval[]): boolean {
  const mode = rule.conditionMode ?? 'all';
  if (mode === 'all') return rule.conditions.every(c => meetsCondition(c, cards));
  return rule.conditions.some(c => meetsCondition(c, cards));
}

export function evaluateTeam(cards: CardForEval[]): TeamSynergyResult {
  const matched: SynergyMatch[] = [];

  for (const rule of SYNERGY_RULES) {
    if (ruleMatches(rule, cards)) {
      matched.push({ rule, activationCount: 1 });
    }
  }

  // Aggregate all effects
  let cpMultiplier = 1;
  const atkMult: number[] = [1];
  const hpMult:  number[] = [1];
  const spdMult: number[] = [1];
  const bonusEffects: SynergyEffect[] = [];

  for (const { rule } of matched) {
    for (const effect of rule.effects) {
      switch (effect.type) {
        case 'cp_multiply':
          cpMultiplier *= effect.multiplier;
          break;
        case 'stat_multiply':
          if (effect.stat === 'all' || effect.stat === 'attack') atkMult.push(effect.multiplier);
          if (effect.stat === 'all' || effect.stat === 'health') hpMult.push(effect.multiplier);
          if (effect.stat === 'all' || effect.stat === 'speed')  spdMult.push(effect.multiplier);
          break;
        default:
          bonusEffects.push(effect);
      }
    }
  }

  return {
    matched,
    cpMultiplier,
    statMultipliers: {
      attack: atkMult.reduce((a, b) => a * b, 1),
      health: hpMult.reduce((a, b) => a * b, 1),
      speed:  spdMult.reduce((a, b) => a * b, 1),
    },
    bonusEffects,
  };
}
