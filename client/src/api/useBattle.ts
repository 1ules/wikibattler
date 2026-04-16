import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import type { ApiResponse, BattleMode, CombatLog } from '@wikibattler/shared';

export interface BattleResponse {
  battle: { id: string; mode: string };
  combatLog: CombatLog;
  coinsEarned: number;
  ratingDelta: number | null;
  cpAttacker: number;
  cpDefender: number;
}

export function useStartBattle() {
  return useMutation({
    mutationFn: async (params: { cardIds: string[]; mode: BattleMode }) => {
      const { data } = await api.post<ApiResponse<BattleResponse>>('/battle/start', params);
      return data.data;
    },
  });
}
