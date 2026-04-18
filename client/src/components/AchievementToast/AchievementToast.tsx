import { useEffect, useState } from 'react';
import type { Achievement } from '../../utils/achievements.js';
import styles from './AchievementToast.module.css';

const TIER_COLORS = {
  bronze:   '#cd7f32',
  silver:   '#94a3b8',
  gold:     '#eab308',
  platinum: '#a855f7',
  mythic:   '#fff',
};

const TIER_GLOW = {
  bronze:   'rgba(205,127,50,0.5)',
  silver:   'rgba(148,163,184,0.5)',
  gold:     'rgba(234,179,8,0.6)',
  platinum: 'rgba(168,85,247,0.6)',
  mythic:   'rgba(192,84,252,0.8)',
};

const CATEGORY_ICONS: Record<string, string> = {
  collection: '📚', rarity: '⭐', foil: '✨',
  packs: '📦', diversity: '🌍', special: '🎲',
};

interface Props {
  achievements: Achievement[];
  onDismiss: (id: string) => void;
}

interface ToastItem {
  ach: Achievement;
  id: string;
  progress: number;
}

const DURATION = 5000;

export function AchievementToast({ achievements, onDismiss }: Props) {
  const [items, setItems] = useState<ToastItem[]>(() =>
    achievements.map(a => ({ ach: a, id: a.id, progress: 100 }))
  );

  useEffect(() => {
    setItems(prev => {
      const existing = new Set(prev.map(i => i.id));
      const next = [...prev];
      for (const a of achievements) {
        if (!existing.has(a.id)) next.push({ ach: a, id: a.id, progress: 100 });
      }
      return next.slice(-4);
    });
  }, [achievements]);

  useEffect(() => {
    if (items.length === 0) return;
    const interval = setInterval(() => {
      setItems(prev =>
        prev
          .map(i => ({ ...i, progress: i.progress - (100 / (DURATION / 50)) }))
          .filter(i => {
            if (i.progress <= 0) { onDismiss(i.id); return false; }
            return true;
          })
      );
    }, 50);
    return () => clearInterval(interval);
  }, [items.length, onDismiss]);

  if (items.length === 0) return null;

  return (
    <div className={styles.stack}>
      {items.map(({ ach, progress }) => {
        const color = TIER_COLORS[ach.tier];
        const glow  = TIER_GLOW[ach.tier];
        const isMythic = ach.tier === 'mythic';
        return (
          <div
            key={ach.id}
            className={[styles.toast, isMythic ? styles.mythic : ''].filter(Boolean).join(' ')}
            style={{ '--toast-color': color, '--toast-glow': glow } as React.CSSProperties}
          >
            <div className={styles.icon}>{CATEGORY_ICONS[ach.category]}</div>
            <div className={styles.body}>
              <span className={styles.label}>Achievement Unlocked!</span>
              <span className={styles.name}
                style={{ color }}
              >{ach.name}</span>
              {ach.reward.title && (
                <span className={styles.reward}>🏷️ {ach.reward.title.text}</span>
              )}
              {ach.reward.background && (
                <span className={styles.reward}>🖼️ {ach.reward.background.label}</span>
              )}
            </div>
            <button className={styles.close} onClick={() => onDismiss(ach.id)}>✕</button>
            <div className={styles.bar}>
              <div className={styles.barFill} style={{ width: `${progress}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
