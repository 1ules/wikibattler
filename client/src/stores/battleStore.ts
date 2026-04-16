import { create } from 'zustand';
import type { CombatLog } from '@wikibattler/shared';

interface BattleResult {
  combatLog: CombatLog;
  coinsEarned: number;
  ratingDelta: number | null;
  cpAttacker: number;
  cpDefender: number;
}

interface BattleState {
  result: BattleResult | null;
  setResult: (result: BattleResult) => void;
  clearResult: () => void;
}

export const useBattleStore = create<BattleState>((set) => ({
  result: null,
  setResult: (result) => set({ result }),
  clearResult: () => set({ result: null }),
}));
