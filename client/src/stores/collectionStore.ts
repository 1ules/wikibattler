import { create } from 'zustand';
import type { UserCard } from '@wikibattler/shared';
import { TEAM_SIZE } from '@wikibattler/shared';

interface CollectionStore {
  team: (UserCard | null)[];
  setTeamSlot: (slot: number, card: UserCard | null) => void;
  clearTeam: () => void;
  isInTeam: (userCardId: string) => boolean;
}

export const useCollectionStore = create<CollectionStore>((set, get) => ({
  team: Array(TEAM_SIZE).fill(null),

  setTeamSlot: (slot, card) => {
    const team = [...get().team];
    team[slot] = card;
    set({ team });
  },

  clearTeam: () => set({ team: Array(TEAM_SIZE).fill(null) }),

  isInTeam: (userCardId) =>
    get().team.some((c) => c !== null && c.id === userCardId),
}));
