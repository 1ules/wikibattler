import { create } from 'zustand';

interface NotificationStore {
  hasNewAchievements: boolean;
  setHasNewAchievements: (v: boolean) => void;
}

export const useNotificationStore = create<NotificationStore>()((set) => ({
  hasNewAchievements: (() => {
    try {
      return (JSON.parse(localStorage.getItem('wb-new-achievements') ?? '[]') as string[]).length > 0;
    } catch {
      return false;
    }
  })(),
  setHasNewAchievements: (v) => set({ hasNewAchievements: v }),
}));
