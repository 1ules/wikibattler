import React, { useRef, useState } from 'react';
import { useCollection } from '../../api/useCards.js';
import { useOpenPack, usePackState, useOpenPityPack } from '../../api/usePacks.js';
import { Card } from '../../components/Card/Card.js';
import { PackOpener } from '../../components/PackOpener/PackOpener.js';
import { usePackStore } from '../../stores/packStore.js';
import { api } from '../../lib/api.js';
import type { UserCard } from '@wikibattler/shared';
import type { QidNode } from '@wikibattler/shared';
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

  const openPack     = useOpenPack();
  const openPityPack = useOpenPityPack();

  const [packOpenerOpen, setPackOpenerOpen] = useState(false);
  const [packCharging, setPackCharging]     = useState(false);
  const [pendingCards, setPendingCards]     = useState<UserCard[] | null>(null);
  const [selectedCard, setSelectedCard]     = useState<UserCard | null>(null);
  const [copiedShare, setCopiedShare]       = useState(false);
  const pollCancelRef = useRef(false);

  usePackState();

  async function handleOpenPack() {
    if (storedPacks < 1 || openPack.isPending) return;
    setPackOpenerOpen(true);
    setPackCharging(true);
    setPendingCards(null);
    pollCancelRef.current = false;

    try {
      const result = await openPack.mutateAsync();
      const userCards = result.cards as UserCard[];

      const allHaveQids = userCards.every(
        uc => (uc.card.qidChain as unknown[]).length > 0
      );
      if (allHaveQids || pollCancelRef.current) {
        setPendingCards(userCards);
        setPackCharging(false);
        return;
      }

      const cardIds = userCards.map(uc => uc.card.id).join(',');
      let attempts = 0;
      const MAX_ATTEMPTS = 10;

      const poll = async () => {
        if (pollCancelRef.current) return;
        attempts++;
        try {
          const { data } = await api.get<{
            data: { allReady: boolean; qidData: Record<string, QidNode[]> };
          }>(`/cards/qids-ready?ids=${cardIds}`);
          const resp = data.data;
          if (resp.allReady || attempts >= MAX_ATTEMPTS) {
            if (!pollCancelRef.current) {
              const enriched = userCards.map(uc => ({
                ...uc,
                card: {
                  ...uc.card,
                  qidChain: resp.qidData[uc.card.id] ?? uc.card.qidChain,
                },
              })) as UserCard[];
              setPendingCards(enriched);
              setPackCharging(false);
            }
          } else {
            setTimeout(poll, 1500);
          }
        } catch {
          if (attempts >= MAX_ATTEMPTS && !pollCancelRef.current) {
            setPendingCards(userCards);
            setPackCharging(false);
          } else if (!pollCancelRef.current) {
            setTimeout(poll, 1500);
          }
        }
      };

      setTimeout(poll, 1500);
    } catch {
      setPackOpenerOpen(false);
      setPackCharging(false);
      setPendingCards(null);
    }
  }

  function handleClosePackOpener() {
    pollCancelRef.current = true;
    setPackOpenerOpen(false);
    setPendingCards(null);
    setPackCharging(false);
  }

  async function handleOpenPityPack(tier: 'SR' | 'UR') {
    try {
      const result = await openPityPack.mutateAsync(tier);
      setPackOpenerOpen(true);
      setPackCharging(false);
      setPendingCards([result.card as UserCard]);
    } catch { /* ignore */ }
  }

  async function handleShare(card: UserCard['card']) {
    const url = `https://en.wikipedia.org/wiki/${card.wikiSlug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `WikiBattler — ${card.wikiTitle}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2000);
      }
    } catch { /* user cancelled share */ }
  }

  const mm = Math.floor(secondsUntilNext / 60).toString().padStart(2, '0');
  const ss = (secondsUntilNext % 60).toString().padStart(2, '0');
  const srPct = (pitySrProgress / PITY_SR_THRESHOLD) * 100;
  const urPct = (pityUrProgress / PITY_UR_THRESHOLD) * 100;

  return (
    <div className={styles.page}>
      {/* Pack opener overlay */}
      {packOpenerOpen && (
        <PackOpener
          cards={pendingCards ?? []}
          isCharging={packCharging}
          onClose={handleClosePackOpener}
        />
      )}

      {/* ── Card detail modal ── */}
      {selectedCard && (
        <div
          className={styles.modalOverlay}
          onClick={() => setSelectedCard(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.modalClose}
              onClick={() => setSelectedCard(null)}
              aria-label="Close"
            >✕</button>

            {/* Full card name */}
            <h2 className={styles.modalCardName}>{selectedCard.card.wikiTitle}</h2>

            {/* Three-column: actions | card | extract */}
            <div className={styles.modalMain}>
              {/* Left — action buttons */}
              <div className={styles.modalActions}>
                <a
                  className={styles.modalActionBtn}
                  href={`https://en.wikipedia.org/wiki/${selectedCard.card.wikiSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View on Wikipedia"
                >
                  <span className={styles.modalActionIcon}>🌐</span>
                  <span>Wiki</span>
                </a>
                <button
                  className={styles.modalActionBtn}
                  onClick={() => handleShare(selectedCard.card)}
                  title="Share card"
                >
                  <span className={styles.modalActionIcon}>
                    {copiedShare ? '✓' : '↗'}
                  </span>
                  <span>{copiedShare ? 'Copied!' : 'Share'}</span>
                </button>
              </div>

              {/* Card — same size/format as collection */}
              <div className={styles.modalCardWrap}>
                <Card userCard={selectedCard} tilt />
              </div>

              {/* Right — scrollable extract with fade */}
              <div className={styles.modalExtract}>
                <div className={styles.modalExtractScroll}>
                  <p className={styles.modalExtractText}>
                    {selectedCard.card.wikiExtract || 'No description available.'}
                  </p>
                </div>
                <div className={styles.modalExtractFade} aria-hidden="true" />
              </div>
            </div>

            {/* WikiData type labels */}
            {(selectedCard.card.qidChain?.length ?? 0) > 0 && (
              <div className={styles.modalTags}>
                {selectedCard.card.qidChain.map((node) => (
                  <span key={node.qid} className={styles.modalTag} title={`${node.qid} · depth ${node.depth}`}>
                    {node.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Page header ── */}
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
            disabled={storedPacks < 1}
          >
            {`Open Pack (${storedPacks})`}
          </button>
        </div>
      </div>

      {/* ── Pity Tracker ── */}
      <section className={styles.pitySection} aria-label="Pity pack tracker">
        <h2 className={styles.pitySectionTitle}>Pity Packs</h2>
        <div className={styles.pityRows}>

          <div className={styles.pityRow}>
            <div className={styles.pityLabel}>
              <span className={styles.pityLabelTitle}>
                SR / SSR
                {pitySrAvailable > 0 && (
                  <span className={`${styles.pityBadge} ${styles.pityBadgeSr}`}>
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
                <div className={`${styles.pityBarFill} ${styles.pityBarFillSr}`} style={{ width: `${srPct}%` }} />
              </div>
              <span className={styles.pityBarLabel}>{pitySrProgress} / {PITY_SR_THRESHOLD} packs</span>
            </div>
            <button
              className={`${styles.pityOpenBtn} ${styles.pityOpenBtnSr}`}
              disabled={pitySrAvailable < 1 || openPityPack.isPending}
              onClick={() => handleOpenPityPack('SR')}
            >
              {pitySrAvailable > 0 ? `Open (${pitySrAvailable})` : 'Not yet'}
            </button>
          </div>

          <div className={styles.pityRow}>
            <div className={styles.pityLabel}>
              <span className={styles.pityLabelTitle}>
                UR / MR
                {pityUrAvailable > 0 && (
                  <span className={`${styles.pityBadge} ${styles.pityBadgeUr}`}>
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
                <div className={`${styles.pityBarFill} ${styles.pityBarFillUr}`} style={{ width: `${urPct}%` }} />
              </div>
              <span className={styles.pityBarLabel}>{pityUrProgress} / {PITY_UR_THRESHOLD} packs</span>
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

      {/* ── Collection grid ── */}
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
