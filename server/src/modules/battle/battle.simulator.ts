import { calculateCP } from '@wikibattler/shared';
import type { CombatLog, CombatTick, TeamSynergyResult } from '@wikibattler/shared';
import type { Card } from '@wikibattler/shared';
import { evaluateTeam } from '../synergy/synergy.engine.js';

interface SimTeam {
  cards: Pick<Card, 'attack' | 'health' | 'speed' | 'rarity' | 'tags'>[];
}

const MAX_TICKS = 200;

export function simulateBattle(attacker: SimTeam, defender: SimTeam): CombatLog {
  const atkSynergy = evaluateTeam(attacker.cards);
  const defSynergy = evaluateTeam(defender.cards);

  const atkStats = applyMultipliers(attacker.cards, atkSynergy);
  const defStats = applyMultipliers(defender.cards, defSynergy);

  let atkHp = atkStats.health;
  let defHp = defStats.health;

  // Extract bonus effects
  const atkRegen = getBonusValue(atkSynergy, 'regen');
  const defRegen = getBonusValue(defSynergy, 'regen');
  const atkShield = getBonusValue(atkSynergy, 'shield');
  const defShield = getBonusValue(defSynergy, 'shield');
  const atkLifesteal = getBonusValue(atkSynergy, 'lifesteal');
  const atkCrit = getBonusValue(atkSynergy, 'crit_chance');
  const defCrit = getBonusValue(defSynergy, 'crit_chance');
  const atkAoe = getBonusValue(atkSynergy, 'aoe_damage');
  const defAoe = getBonusValue(defSynergy, 'aoe_damage');
  const atkFirstStrike = hasBonusEffect(atkSynergy, 'first_strike');
  const atkExecute = getExecuteThreshold(atkSynergy);

  // Apply shields
  atkHp += atkShield;
  defHp += defShield;

  const ticks: CombatTick[] = [];
  let totalAtkDamage = 0;
  let totalDefDamage = 0;

  // Compute ticks per attack based on speed
  const atkTicksPerAttack = Math.max(1, Math.round(10 - atkStats.speed / 200));
  const defTicksPerAttack = Math.max(1, Math.round(10 - defStats.speed / 200));

  for (let tick = 1; tick <= MAX_TICKS; tick++) {
    const events: CombatTick['events'] = [];
    let atkDmg = 0;
    let defDmg = 0;

    // First strike on tick 1
    const atkAttacksThisTick = tick === 1 && atkFirstStrike
      ? true
      : tick % atkTicksPerAttack === 0;
    const defAttacksThisTick = tick % defTicksPerAttack === 0;

    if (atkAttacksThisTick) {
      const crit = Math.random() < atkCrit;
      atkDmg = Math.round(atkStats.attack * (crit ? 1.5 : 1));
      if (crit) events.push({ type: 'crit', source: 'attacker', amount: atkDmg });
      else events.push({ type: 'damage', source: 'attacker', amount: atkDmg });

      defHp -= atkDmg;
      totalAtkDamage += atkDmg;

      if (atkLifesteal > 0) {
        const heal = Math.round(atkDmg * atkLifesteal);
        atkHp = Math.min(atkHp + heal, atkStats.health + atkShield);
        events.push({ type: 'regen', source: 'attacker', amount: heal });
      }

      // Execute
      if (atkExecute > 0 && defHp > 0 && defHp <= defStats.health * atkExecute) {
        events.push({ type: 'execute', source: 'attacker' });
        defHp = 0;
      }
    }

    if (defAttacksThisTick && defHp > 0) {
      const crit = Math.random() < defCrit;
      defDmg = Math.round(defStats.attack * (crit ? 1.5 : 1));
      if (crit) events.push({ type: 'crit', source: 'defender', amount: defDmg });
      else events.push({ type: 'damage', source: 'defender', amount: defDmg });

      atkHp -= defDmg;
      totalDefDamage += defDmg;
    }

    // AoE
    if (atkAoe > 0) { defHp -= atkAoe; totalAtkDamage += atkAoe; }
    if (defAoe > 0 && defHp > 0) { atkHp -= defAoe; totalDefDamage += defAoe; }

    // Regen
    if (atkRegen > 0) { atkHp = Math.min(atkHp + atkRegen, atkStats.health + atkShield); events.push({ type: 'regen', source: 'attacker', amount: atkRegen }); }
    if (defRegen > 0 && defHp > 0) { defHp = Math.min(defHp + defRegen, defStats.health + defShield); events.push({ type: 'regen', source: 'defender', amount: defRegen }); }

    ticks.push({ tick, attackerHp: Math.max(0, atkHp), defenderHp: Math.max(0, defHp), attackerDamage: atkDmg, defenderDamage: defDmg, events });

    if (atkHp <= 0 || defHp <= 0) break;
  }

  let winner: CombatLog['winner'];
  if (atkHp > 0 && defHp <= 0) winner = 'attacker';
  else if (defHp > 0 && atkHp <= 0) winner = 'defender';
  else if (atkHp > defHp) winner = 'attacker';
  else if (defHp > atkHp) winner = 'defender';
  else winner = 'draw';

  return { ticks, winner, totalTicks: ticks.length };
}

interface AggStats { attack: number; health: number; speed: number }

function applyMultipliers(
  cards: Pick<Card, 'attack' | 'health' | 'speed'>[],
  synergy: TeamSynergyResult
): AggStats {
  const { attack: am, health: hm, speed: sm } = synergy.statMultipliers;
  return {
    attack: Math.round(cards.reduce((s, c) => s + c.attack, 0) * am),
    health: Math.round(cards.reduce((s, c) => s + c.health, 0) * hm),
    speed:  Math.round(cards.reduce((s, c) => s + c.speed, 0) * sm),
  };
}

function getBonusValue(synergy: TeamSynergyResult, type: string): number {
  let total = 0;
  for (const e of synergy.bonusEffects) {
    if (e.type === type) {
      if ('hpPerTick' in e) total += e.hpPerTick;
      else if ('fraction' in e) total += e.fraction;
      else if ('chance' in e) total += e.chance;
      else if ('flatAmount' in e) total += e.flatAmount;
      else if ('damagePerTick' in e) total += e.damagePerTick;
    }
  }
  return total;
}

function hasBonusEffect(synergy: TeamSynergyResult, type: string): boolean {
  return synergy.bonusEffects.some(e => e.type === type);
}

function getExecuteThreshold(synergy: TeamSynergyResult): number {
  for (const e of synergy.bonusEffects) {
    if (e.type === 'execute_low_hp') return e.hpThresholdFraction;
  }
  return 0;
}
