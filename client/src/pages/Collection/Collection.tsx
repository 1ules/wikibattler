import { useState } from 'react';
import { useCollection } from '../../api/useCards.js';
import { useOpenPack, usePackState } from '../../api/usePacks.js';
import { Card } from '../../components/Card/Card.js';
import { usePackStore } from '../../stores/packStore.js';
import type { UserCard } from '@wikibattler/shared';
import styles from './Collection.module.css';

export function Collection() {
  const { data: collection, isLoading } = useCollection();
  const { storedPacks } = usePackStore();
  const openPack = useOpenPack();
  const [newCards, setNewCards] = useState<UserCard[]>([]);

  usePackState();

  async function handleOpenPack() {
    const result = await openPack.mutateAsync();
    setNewCards(result.cards);
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Collection</h1>
        <button
          className={styles.openPackBtn}
          onClick={handleOpenPack}
          disabled={storedPacks < 1 || openPack.isPending}
        >
          {openPack.isPending ? 'Opening...' : `Open Pack (${storedPacks})`}
        </button>
      </div>

      {newCards.length > 0 && (
        <div className={styles.newCards}>
          <span className={styles.newCardsTitle}>New Cards!</span>
          <div className={styles.newCardsGrid}>
            {newCards.map((uc, i) => (
              <Card key={uc.id} userCard={uc} revealing style={{ animationDelay: `${i * 0.12}s` } as React.CSSProperties} />
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className={styles.loadingGrid}>
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className={styles.cardSkeleton} />
          ))}
        </div>
      ) : collection?.data.length === 0 ? (
        <div className={styles.empty}>
          <p>Your collection is empty.</p>
          <p>Open a pack to get your first cards!</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {collection?.data.map((uc) => (
            <Card key={uc.id} userCard={uc as UserCard} />
          ))}
        </div>
      )}
    </div>
  );
}
