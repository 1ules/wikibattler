import { calculateCP } from '@wikibattler/shared';
import type { CombatLog, CombatTick, TeamSynergyResult } from '@wikibattler/shared';

interface SimCard {
  attack: number;
  health: number;
  speed: number;
}

interface SimTeam {
  cards: SimCard[];
  synergy: TeamSynergyResult;
}

const MAX_TICKS = 200;

export function simulateBattle(attacker: SimTeam, defender: SimTeam): CombatLog {
  const atkStats = applyMultipliers(attacker.cards, attacker.synergy);
  const defStats = applyMultipliers(defender.cards, defender.synergy);

  let atkHp = atkStats.health;
  let defHp = defStats.health;

  const atkTicksPerAttack = Math.max(1, Math.round(10 - atkStats.speed / 200));
  const defTicksPerAttack = Math.max(1, Math.round(10 - defStats.speed / 200));

  const ticks: CombatTick[] = [];

  for (let tick = 1; tick <= MAX_TICKS; tick++) {
    const events: CombatTick['events'] = [];
    let atkDmg = 0;
    let defDmg = 0;

    if (tick % atkTicksPerAttack === 0) {
      atkDmg = atkStats.attack;
      events.push({ type: 'damage', source: 'attacker', amount: atkDmg });
      defHp -= atkDmg;
    }

    if (tick % defTicksPerAttack === 0 && defHp > 0) {
      defDmg = defStats.attack;
      events.push({ type: 'damage', source: 'defender', amount: defDmg });
      atkHp -= defDmg;
    }

    ticks.push({
      tick,
      attackerHp: Math.max(0, atkHp),
      defenderHp: Math.max(0, defHp),
      attackerDamage: atkDmg,
      defenderDamage: defDmg,
      events,
    });

    if (atkHp <= 0 || defHp <= 0) break;
  }

  let winner: CombatLog['winner'];
  if      (atkHp > 0 && defHp <= 0) winner = 'attacker';
  else if (defHp > 0 && atkHp <= 0) winner = 'defender';
  else if (atkHp > defHp)            winner = 'attacker';
  else if (defHp > atkHp)            winner = 'defender';
  else                               winner = 'draw';

  return { ticks, winner, totalTicks: ticks.length };
}

function applyMultipliers(cards: SimCard[], synergy: TeamSynergyResult) {
  const { attack: am, health: hm, speed: sm } = synergy.statMultipliers;
  return {
    attack: Math.round(cards.reduce((s, c) => s + c.attack, 0) * am),
    health: Math.round(cards.reduce((s, c) => s + c.health, 0) * hm),
    speed:  Math.round(cards.reduce((s, c) => s + c.speed,  0) * sm),
  };
}

// Re-export for callers that only need CP
export { calculateCP };
