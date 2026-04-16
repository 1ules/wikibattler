import React, { useState } from 'react';
import { useCollection } from '../../api/useCards.js';
import { useOpenPack, usePackState, useOpenPityPack } from '../../api/usePacks.js';
import { Card } from '../../components/Card/Card.js';
import { PackOpener } from '../../components/PackOpener/PackOpener.js';
import { usePackStore } from '../../stores/packStore.js';
import type { UserCard } from '@wikibattler/shared';
import { PITY_SR_THRESHOLD, PITY_UR_THRESHOLD } from '@wikibattler/shared';
import styles from './Collection.module.css';

export function Collection() {
  const { data: collection, isLoading } = useCollection();
  const {
    storedPacks,
    secondsUntilNext,
    pitySrAvailable,
    pityUrAvailable,
    pitySrProgress,
    pityUrProgress,
  } = usePackStore();

  const openPack = useOpenPack();
  const openPityPack = useOpenPityPack();
  const [pendingCards, setPendingCards] = useState<UserCard[] | null>(null);
  const [selectedCard, setSelectedCard] = useState<UserCard | null>(null);

  usePackState();

  async function handleOpenPack() {
    try {
      const result = await openPack.mutateAsync();
      setPendingCards(result.cards as UserCard[]);
    } catch {
      // 409 = no packs available; silently ignore
    }
  }

  async function handleOpenPityPack(tier: 'SR' | 'UR') {
    try {
      const result = await openPityPack.mutateAsync(tier);
      setPendingCards([result.card as UserCard]);
    } catch {
      // ignore
    }
  }

  function handleOpenerClose() {
    setPendingCards(null);
  }

  const mm = Math.floor(secondsUntilNext / 60).toString().padStart(2, '0');
  const ss = (secondsUntilNext % 60).toString().padStart(2, '0');

  const srPct = (pitySrProgress / PITY_SR_THRESHOLD) * 100;
  const urPct = (pityUrProgress / PITY_UR_THRESHOLD) * 100;

  return (
    <div className={styles.page}>
      {/* Pack opener overlay */}
      {pendingCards && (
        <PackOpener cards={pendingCards} onClose={handleOpenerClose} />
      )}

      {/* Card detail modal */}
      {selectedCard && (
        <div
          className={styles.modalOverlay}
          onClick={() => setSelectedCard(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.modalClose}
              onClick={() => setSelectedCard(null)}
              aria-label="Close"
            >
              ✕
            </button>
            <Card userCard={selectedCard} large tilt />
          </div>
        </div>
      )}

      {/* Page header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Collection</h1>
        <div className={styles.packControls}>
          {storedPacks < 1 && secondsUntilNext > 0 && (
            <span className={styles.packTimer}>
              Next pack in <span className={styles.countdown}>{mm}:{ss}</span>
            </span>
          )}
          <button
            className={styles.openPackBtn}
            onClick={handleOpenPack}
            disabled={storedPacks < 1 || openPack.isPending}
          >
            {openPack.isPending ? 'Opening…' : `Open Pack (${storedPacks})`}
          </button>
        </div>
      </div>

      {/* ── Pity Tracker ── */}
      <section className={styles.pitySection} aria-label="Pity pack tracker">
        <h2 className={styles.pitySectionTitle}>Pity Packs</h2>
        <div className={styles.pityRows}>

          {/* SR / SSR pity row */}
          <div className={styles.pityRow}>
            <div className={styles.pityLabel}>
              <span className={styles.pityLabelTitle}>
                SR / SSR
                {pitySrAvailable > 0 && (
                  <span className={styles.pityBadge + ' ' + styles.pityBadgeSr}>
                    {pitySrAvailable}
                  </span>
                )}
              </span>
              <span className={styles.pityLabelSub}>
                Every {PITY_SR_THRESHOLD} packs · 50/50 SR or SSR
              </span>
            </div>
            <div className={styles.pityBarWrap}>
              <div className={styles.pityBarTrack}>
                <div
                  className={`${styles.pityBarFill} ${styles.pityBarFillSr}`}
                  style={{ width: `${srPct}%` }}
                />
              </div>
              <span className={styles.pityBarLabel}>
                {pitySrProgress} / {PITY_SR_THRESHOLD} packs
              </span>
            </div>
            <button
              className={`${styles.pityOpenBtn} ${styles.pityOpenBtnSr}`}
              disabled={pitySrAvailable < 1 || openPityPack.isPending}
              onClick={() => handleOpenPityPack('SR')}
            >
              {pitySrAvailable > 0 ? `Open (${pitySrAvailable})` : 'Not yet'}
            </button>
          </div>

          {/* UR / MR pity row */}
          <div className={styles.pityRow}>
            <div className={styles.pityLabel}>
              <span className={styles.pityLabelTitle}>
                UR / MR
                {pityUrAvailable > 0 && (
                  <span className={styles.pityBadge + ' ' + styles.pityBadgeUr}>
                    {pityUrAvailable}
                  </span>
                )}
              </span>
              <span className={styles.pityLabelSub}>
                Every {PITY_UR_THRESHOLD} packs · 50/50 UR or MR
              </span>
            </div>
            <div className={styles.pityBarWrap}>
              <div className={styles.pityBarTrack}>
                <div
                  className={`${styles.pityBarFill} ${styles.pityBarFillUr}`}
                  style={{ width: `${urPct}%` }}
                />
              </div>
              <span className={styles.pityBarLabel}>
                {pityUrProgress} / {PITY_UR_THRESHOLD} packs
              </span>
            </div>
            <button
              className={`${styles.pityOpenBtn} ${styles.pityOpenBtnUr}`}
              disabled={pityUrAvailable < 1 || openPityPack.isPending}
              onClick={() => handleOpenPityPack('UR')}
            >
              {pityUrAvailable > 0 ? `Open (${pityUrAvailable})` : 'Not yet'}
            </button>
          </div>

        </div>
      </section>

      {/* Collection grid */}
      {isLoading ? (
        <div className={styles.loadingGrid}>
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className={styles.cardSkeleton} />
          ))}
        </div>
      ) : (collection?.data.length ?? 0) === 0 ? (
        <div className={styles.empty}>
          <p>Your collection is empty.</p>
          <p>Open a pack to get your first cards!</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {collection?.data.map((uc) => (
            <Card
              key={uc.id}
              userCard={uc as UserCard}
              onClick={() => setSelectedCard(uc as UserCard)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
