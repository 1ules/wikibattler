import { useMemo, useState } from 'react';
import { useCollection } from '../../api/useCards.js';
import {
  ACHIEVEMENTS, computeStats, checkCondition, getProgress,
  type AchievementCategory, type AchievementTier,
} from '../../utils/achievements.js';
import { useNotificationStore } from '../../stores/notificationStore.js';
import styles from './Achievements.module.css';

const CATEGORY_LABELS: Record<AchievementCategory | 'all', string> = {
  all: 'All', collection: 'Collection', rarity: 'Rarity',
  foil: 'Foil', packs: 'Packs', diversity: 'Diversity', special: 'Special',
};

const STATUS_LABELS = { all: 'All', unlocked: 'Unlocked', locked: 'Locked' };

const TIER_ICONS: Record<AchievementTier, string> = {
  bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎', mythic: '🌌',
};

const CATEGORY_ICONS: Record<AchievementCategory, string> = {
  collection: '📚', rarity: '⭐', foil: '✨', packs: '📦', diversity: '🌍', special: '🎲',
};

export default function Achievements() {
  const { data: collectionData } = useCollection();
  const [catFilter, setCatFilter] = useState<AchievementCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const setHasNewAchievements = useNotificationStore(s => s.setHasNewAchievements);

  // Claimed achievements (rewards applied)
  const [claimedIds, setClaimedIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('wb-claimed-achievements') ?? '[]') as string[]); }
    catch { return new Set(); }
  });

  const stats = useMemo(() => {
    const cards = (collectionData?.data ?? []).map((uc: { card: { rarity: string; tags?: string[] }; isFoil: boolean }) => ({
      rarity: uc.card.rarity,
      isFoil: uc.isFoil,
      tags: uc.card.tags ?? [],
    }));
    const packsOpened = parseInt(localStorage.getItem('wb-packs-opened') ?? '0', 10);
    const pityClaimed = localStorage.getItem('wb-pity-claimed') === '1';
    const hadMaxStoredPacks = localStorage.getItem('wb-had-max-packs') === '1';
    return computeStats(cards, packsOpened, pityClaimed, hadMaxStoredPacks);
  }, [collectionData]);

  const filtered = useMemo(() => {
    return ACHIEVEMENTS.filter(a => {
      if (catFilter !== 'all' && a.category !== catFilter) return false;
      const done = checkCondition(a.condition, stats);
      if (statusFilter === 'unlocked' && !done) return false;
      if (statusFilter === 'locked' && done) return false;
      return true;
    });
  }, [catFilter, statusFilter, stats]);

  const unlockedCount = useMemo(
    () => ACHIEVEMENTS.filter(a => checkCondition(a.condition, stats)).length,
    [stats],
  );

  const pct = Math.round((unlockedCount / ACHIEVEMENTS.length) * 100);

  function claimAchievement(id: string) {
    setClaimedIds(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem('wb-claimed-achievements', JSON.stringify([...next]));
      // Clear nav dot if no more unclaimed unlocked achievements remain
      const unlocked: string[] = JSON.parse(localStorage.getItem('wb-unlocked-achievements') ?? '[]');
      const anyUnclaimed = unlocked.some(uid => !next.has(uid));
      if (!anyUnclaimed) setHasNewAchievements(false);
      return next;
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Achievements</h1>
        <p className={styles.subtitle}>Track your progress and earn exclusive rewards.</p>
      </div>

      <div className={styles.progressSummary}>
        <span className={styles.progressLabel}>Overall progress</span>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${pct}%` }} />
        </div>
        <span className={styles.progressCount}>{unlockedCount} / {ACHIEVEMENTS.length}</span>
      </div>

      <div className={styles.filters}>
        {(Object.keys(CATEGORY_LABELS) as Array<AchievementCategory | 'all'>).map(k => (
          <button
            key={k}
            className={[styles.filterBtn, catFilter === k ? styles.active : ''].join(' ')}
            onClick={() => setCatFilter(k)}
          >
            {CATEGORY_LABELS[k]}
          </button>
        ))}
        <div style={{ width: 1, background: 'rgba(255,255,255,0.08)', margin: '0 0.25rem' }} />
        {(Object.keys(STATUS_LABELS) as Array<'all' | 'unlocked' | 'locked'>).map(k => (
          <button
            key={k}
            className={[styles.filterBtn, statusFilter === k ? styles.active : ''].join(' ')}
            onClick={() => setStatusFilter(k)}
          >
            {STATUS_LABELS[k]}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {filtered.length === 0 && (
          <div className={styles.empty}>No achievements match your filters.</div>
        )}
        {filtered.map(ach => {
          const done    = checkCondition(ach.condition, stats);
          const claimed = claimedIds.has(ach.id);
          const isNew   = done && !claimed;
          const { current, target } = getProgress(ach, stats);
          const fillPct = Math.min(100, Math.round((current / target) * 100));

          return (
            <div
              key={ach.id}
              className={[styles.card, done ? styles.unlocked : styles.locked].join(' ')}
              data-tier={ach.tier}
            >
              {isNew && <span className={styles.newDot} aria-hidden="true" />}
              <div className={styles.cardTop}>
                <span className={styles.cardIcon}>{CATEGORY_ICONS[ach.category]}</span>
                <div className={styles.cardMeta}>
                  <p className={styles.cardName}>{ach.name}</p>
                  <span className={styles.cardTier}>{TIER_ICONS[ach.tier]} {ach.tier}</span>
                </div>
                {done && claimed && <span className={styles.unlockedBadge}>✅</span>}
              </div>

              <p className={styles.cardDesc}>{ach.description}</p>

              <div className={styles.cardProgress}>
                <div className={styles.cardProgressRow}>
                  <span>Progress</span>
                  <span>{Math.min(current, target).toLocaleString()} / {target.toLocaleString()}</span>
                </div>
                <div className={styles.cardProgressTrack}>
                  <div className={styles.cardProgressFill} style={{ width: `${fillPct}%` }} />
                </div>
              </div>

              <div className={styles.rewardPreview}>
                {ach.reward.title && (
                  <span className={styles.rewardChip}><span>🏷️</span> Title: {ach.reward.title.text}</span>
                )}
                {ach.reward.subtitle && (
                  <span className={styles.rewardChip}><span>💬</span> Subtitle: {ach.reward.subtitle.text}</span>
                )}
                {ach.reward.background && (
                  <span className={styles.rewardChip}><span>🖼️</span> BG: {ach.reward.background.label}</span>
                )}
              </div>

              {done && !claimed && (
                <button className={styles.claimBtn} onClick={() => claimAchievement(ach.id)}>
                  Claim Reward
                </button>
              )}
              {done && claimed && (
                <span className={styles.claimedLabel}>Reward claimed</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
