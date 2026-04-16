import React, { useState } from 'react';
import { TeamBuilder } from '../../components/TeamBuilder/TeamBuilder.js';
import { BattleArena } from '../../components/BattleArena/BattleArena.js';
import { useStartBattle } from '../../api/useBattle.js';
import { useBattleStore } from '../../stores/battleStore.js';
import type { BattleMode } from '@wikibattler/shared';
import styles from './Battle.module.css';

type Phase = 'setup' | 'battling' | 'result';

export function Battle() {
  const [phase, setPhase] = useState<Phase>('setup');
  const startBattle = useStartBattle();
  const { result, setResult, clearResult } = useBattleStore();

  async function handleBattle(cardIds: string[], mode: BattleMode) {
    setPhase('battling');
    try {
      const data = await startBattle.mutateAsync({ cardIds, mode });
      setResult({
        combatLog: data.combatLog,
        coinsEarned: data.coinsEarned,
        ratingDelta: data.ratingDelta,
        cpAttacker: data.cpAttacker,
        cpDefender: data.cpDefender,
      });
      setPhase('result');
    } catch {
      setPhase('setup');
    }
  }

  function handlePlayAgain() {
    clearResult();
    setPhase('setup');
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Battle</h1>
        {phase === 'battling' && (
          <span className={styles.resolvingBadge}>Resolving battle…</span>
        )}
      </div>

      {phase !== 'result' && (
        <TeamBuilder
          onBattle={handleBattle}
          isBattling={phase === 'battling'}
        />
      )}

      {phase === 'result' && result && (
        <BattleArena
          combatLog={result.combatLog}
          cpAttacker={result.cpAttacker}
          cpDefender={result.cpDefender}
          coinsEarned={result.coinsEarned}
          ratingDelta={result.ratingDelta}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  );
}
