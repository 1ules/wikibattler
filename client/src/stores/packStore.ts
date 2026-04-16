import { create } from 'zustand';
import { MAX_STORED_PACKS, PACK_COOLDOWN_SECONDS, PITY_SR_THRESHOLD, PITY_UR_THRESHOLD } from '@wikibattler/shared';

interface PackStore {
  storedPacks: number;
  nextPackAt: Date | null;
  secondsUntilNext: number;
  totalOpened: number;
  pitySrAvailable: number;
  pityUrAvailable: number;
  pitySrProgress: number;
  pityUrProgress: number;
  setPackState: (state: {
    storedPacks: number;
    nextPackAt: string;
    totalOpened: number;
    pitySrAvailable: number;
    pityUrAvailable: number;
    pitySrProgress: number;
    pityUrProgress: number;
  }) => void;
  tick: () => void;
}

export const usePackStore = create<PackStore>((set, get) => ({
  storedPacks: 0,
  nextPackAt: null,
  secondsUntilNext: PACK_COOLDOWN_SECONDS,
  totalOpened: 0,
  pitySrAvailable: 0,
  pityUrAvailable: 0,
  pitySrProgress: 0,
  pityUrProgress: 0,

  setPackState: ({ storedPacks, nextPackAt, totalOpened, pitySrAvailable, pityUrAvailable, pitySrProgress, pityUrProgress }) => {
    const next = new Date(nextPackAt);
    const secs = Math.max(0, Math.ceil((next.getTime() - Date.now()) / 1000));
    set({
      storedPacks,
      nextPackAt: next,
      secondsUntilNext: secs,
      totalOpened,
      pitySrAvailable,
      pityUrAvailable,
      pitySrProgress,
      pityUrProgress,
    });
  },

  tick: () => {
    const { nextPackAt } = get();
    if (!nextPackAt) return;
    const secs = Math.max(0, Math.ceil((nextPackAt.getTime() - Date.now()) / 1000));
    set({ secondsUntilNext: secs });
  },
}));

// Global 1-second interval
setInterval(() => {
  usePackStore.getState().tick();
}, 1000);
