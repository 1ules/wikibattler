import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import type { ApiResponse } from '@wikibattler/shared';
import styles from './Leaderboard.module.css';

interface RankedPlayer {
  id: string;
  username: string | null;
  rating: number;
  avatarUrl: string | null;
}

export function Leaderboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', 'ranked'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<RankedPlayer[]>>('/leaderboard/ranked');
      return data.data;
    },
  });

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Ranked Leaderboard</h1>
      {isLoading ? (
        <p className={styles.loading}>Loading...</p>
      ) : (
        <ol className={styles.list}>
          {(data ?? []).map((player, i) => (
            <li key={player.id} className={styles.row}>
              <span className={styles.rank}>#{i + 1}</span>
              <span className={styles.name}>{player.username ?? 'Player'}</span>
              <span className={styles.rating}>{player.rating}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
