import { usePackStore } from '../../stores/packStore.js';
import { PACK_COOLDOWN_SECONDS, MAX_STORED_PACKS } from '@wikibattler/shared';
import styles from './PackTimer.module.css';

export function PackTimer() {
  const { storedPacks, secondsUntilNext } = usePackStore();
  const isReady = storedPacks >= MAX_STORED_PACKS || secondsUntilNext === 0;
  const progress = isReady
    ? 100
    : Math.round((1 - secondsUntilNext / PACK_COOLDOWN_SECONDS) * 100);

  const mins = Math.floor(secondsUntilNext / 60);
  const secs = secondsUntilNext % 60;
  const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div className={styles.timer}>
      <div className={[styles.ring, isReady ? styles.ready : ''].join(' ')}>
        <div
          className={styles.ringTrack}
          style={{ '--progress': progress } as React.CSSProperties}
        >
          <div className={styles.ringInner}>
            <span className={styles.countdown}>
              {isReady ? '✓' : display}
            </span>
          </div>
        </div>
      </div>
      <span className={styles.packCount}>{storedPacks}/{MAX_STORED_PACKS}</span>
      <span className={styles.label}>
        {storedPacks >= MAX_STORED_PACKS ? 'Packs full!' : 'Next pack'}
      </span>
    </div>
  );
}
