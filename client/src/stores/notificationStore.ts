import { create } from 'zustand';

interface NotificationStore {
  hasNewAchievements: boolean;
  setHasNewAchievements: (v: boolean) => void;
}

function hasUnclaimedAchievements(): boolean {
  try {
    const unlocked = JSON.parse(localStorage.getItem('wb-unlocked-achievements') ?? '[]') as string[];
    const claimed  = new Set(JSON.parse(localStorage.getItem('wb-claimed-achievements') ?? '[]') as string[]);
    return unlocked.some(id => !claimed.has(id));
  } catch {
    return false;
  }
}

export const useNotificationStore = create<NotificationStore>()((set) => ({
  hasNewAchievements: hasUnclaimedAchievements(),
  setHasNewAchievements: (v) => set({ hasNewAchievements: v }),
}));
