import { create } from 'zustand';
import { MAX_STORED_PACKS, PACK_COOLDOWN_SECONDS } from '@wikibattler/shared';

interface PackStore {
  storedPacks: number;
  nextPackAt: Date | null;
  secondsUntilNext: number;
  setPackState: (stored: number, nextPackAt: string) => void;
  tick: () => void;
}

export const usePackStore = create<PackStore>((set, get) => ({
  storedPacks: 0,
  nextPackAt: null,
  secondsUntilNext: PACK_COOLDOWN_SECONDS,

  setPackState: (stored, nextPackAt) => {
    const next = new Date(nextPackAt);
    const secs = Math.max(0, Math.ceil((next.getTime() - Date.now()) / 1000));
    set({ storedPacks: stored, nextPackAt: next, secondsUntilNext: secs });
  },

  tick: () => {
    const { nextPackAt, storedPacks } = get();
    if (!nextPackAt) return;
    const secs = Math.max(0, Math.ceil((nextPackAt.getTime() - Date.now()) / 1000));
    set({ secondsUntilNext: secs });
  },
}));

// Global 1-second interval
setInterval(() => {
  usePackStore.getState().tick();
}, 1000);
