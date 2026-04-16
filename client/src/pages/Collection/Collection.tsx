import React, { useState } from 'react';
import { useCollection } from '../../api/useCards.js';
import { useOpenPack, usePackState } from '../../api/usePacks.js';
import { Card } from '../../components/Card/Card.js';
import { PackOpener } from '../../components/PackOpener/PackOpener.js';
import { usePackStore } from '../../stores/packStore.js';
import type { UserCard } from '@wikibattler/shared';
import styles from './Collection.module.css';

export function Collection() {
  const { data: collection, isLoading } = useCollection();
  const { storedPacks, secondsUntilNext } = usePackStore();
  const openPack = useOpenPack();
  const [pendingCards, setPendingCards] = useState<UserCard[] | null>(null);
  const [selectedCard, setSelectedCard] = useState<UserCard | null>(null);

  usePackState();

  async function handleOpenPack() {
    try {
      const result = await openPack.mutateAsync();
      setPendingCards(result.cards as UserCard[]);
    } catch {
      // 409 = no packs available (store already up to date); silently ignore
    }
  }

  function handleOpenerClose() {
    setPendingCards(null);
  }

  const mm = Math.floor(secondsUntilNext / 60).toString().padStart(2, '0');
  const ss = (secondsUntilNext % 60).toString().padStart(2, '0');

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
            <Card userCard={selectedCard} />
          </div>
        </div>
      )}

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
