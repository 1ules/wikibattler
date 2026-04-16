import React from 'react';
import type { UserCard } from '@wikibattler/shared';
import { RARITY_DISPLAY } from '@wikibattler/shared';
import styles from './Card.module.css';

interface CardProps {
  userCard: UserCard;
  revealing?: boolean;
  onClick?: () => void;
  selected?: boolean;
  style?: React.CSSProperties;
}

export function Card({ userCard, revealing = false, onClick, selected = false, style }: CardProps) {
  const { card, isFoil } = userCard;
  const rarityInfo = RARITY_DISPLAY[card.rarity];

  const foilClass =
    isFoil && card.rarity === 'MR'  ? styles['foil-mr'] :
    isFoil && card.rarity === 'SSR' ? styles['foil-ssr'] :
    '';

  const rarityBorderClass = styles[`rarity-${card.rarity}`] ?? '';
  const rarityBadgeClass  = styles[`rarityBadge-${card.rarity}`] ?? '';

  return (
    <article
      className={[
        styles.card,
        rarityBorderClass,
        foilClass,
        revealing ? styles.revealing : '',
        selected ? styles.selected : '',
      ].filter(Boolean).join(' ')}
      style={style}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`${card.wikiTitle}, ${rarityInfo.label}`}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      {/* Header */}
      <header className={styles.header}>
        <span className={styles.name}>{card.wikiTitle}</span>
        <span className={[styles.rarityBadge, rarityBadgeClass].join(' ')}>
          {card.rarity}
        </span>
      </header>

      {/* Art */}
      <div className={styles.art}>
        {card.wikiThumbUrl ? (
          <img
            className={styles.artImage}
            src={card.wikiThumbUrl}
            alt={card.wikiTitle}
            loading="lazy"
          />
        ) : (
          <div className={styles.artFallback}>{card.wikiTitle}</div>
        )}
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>ATK</span>
          <span className={styles.statValue}>{card.attack.toLocaleString()}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>HP</span>
          <span className={styles.statValue}>{card.health.toLocaleString()}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>SPD</span>
          <span className={styles.statValue}>{card.speed.toLocaleString()}</span>
        </div>
      </div>

      {/* Description */}
      {card.wikiExtract && (
        <p className={styles.description}>{card.wikiExtract}</p>
      )}

      {/* Tags */}
      {(card.tags?.length ?? 0) > 0 && (
        <div className={styles.tags}>
          {card.tags.slice(0, 5).map((tag) => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>
      )}
    </article>
  );
}
