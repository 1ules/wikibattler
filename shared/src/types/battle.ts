import type { UserCard } from './card.js';
import type { TeamSynergyResult } from './synergy.js';

export type BattleMode = 'TRAINING' | 'CASUAL' | 'RANKED' | 'RAID';

export interface TeamSnapshot {
  userId: string;
  username: string;
  cards: UserCard[];
  cp: number;
  synergyResult: TeamSynergyResult;
}

export interface CombatTick {
  tick: number;
  attackerHp: number;
  defenderHp: number;
  attackerDamage: number;
  defenderDamage: number;
  events: CombatEvent[];
}

export type CombatEvent =
  | { type: 'damage'; source: 'attacker' | 'defender'; amount: number }
  | { type: 'regen'; source: 'attacker' | 'defender'; amount: number }
  | { type: 'shield'; source: 'attacker' | 'defender'; amount: number }
  | { type: 'execute'; source: 'attacker' | 'defender' }
  | { type: 'crit'; source: 'attacker' | 'defender'; amount: number };

export interface CombatLog {
  ticks: CombatTick[];
  winner: 'attacker' | 'defender' | 'draw';
  totalTicks: number;
}

export interface BattleResult {
  id: string;
  mode: BattleMode;
  attacker: TeamSnapshot;
  defender: TeamSnapshot | null;
  winner: 'attacker' | 'defender' | 'draw';
  combatLog: CombatLog;
  coinsEarned: number;
  ratingDelta: number | null;
  createdAt: string;
}
