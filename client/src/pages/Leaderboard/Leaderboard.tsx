import styles from './Leaderboard.module.css';

export function Leaderboard() {
  return (
    <div className={styles.container}>
      <div className={styles.icon}>🏆</div>
      <h1 className={styles.title}>Ranks</h1>
      <span className={styles.badge}>Phase 2</span>
      <p className={styles.desc}>
        Compete in ranked seasons, climb the global leaderboard, and earn
        exclusive rewards for reaching the top.
      </p>
    </div>
  );
}
