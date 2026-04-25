import { useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';
import { usePackState } from '../../api/usePacks.js';
import { useNotificationStore } from '../../stores/notificationStore.js';
import styles from './AppShell.module.css';

function PackStateSync() {
  usePackState();
  return null;
}

export function AppShell() {
  const { isGuest, isAuthenticated, clearAuth } = useAuthStore();
  const hasNewAchievements = useNotificationStore(s => s.hasNewAchievements);

  // When the refresh cookie expires the API interceptor dispatches this event.
  // Clear persisted auth so the user isn't stuck in a broken authenticated state.
  useEffect(() => {
    const handler = () => clearAuth();
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, [clearAuth]);

  return (
    <div className={styles.shell}>
      {isAuthenticated && <PackStateSync />}
      <header className={styles.header}>
        <span className={styles.logo}>WikiBattler</span>

        <nav className={styles.nav}>
          <NavLink to="/"            className={({ isActive }) => [styles.navLink, isActive ? styles.active : ''].join(' ')}>Home</NavLink>
          <NavLink to="/collection"  className={({ isActive }) => [styles.navLink, isActive ? styles.active : ''].join(' ')}>Collection</NavLink>
          <NavLink to="/achievements" className={({ isActive }) => [styles.navLink, isActive ? styles.active : ''].join(' ')}>
            Achievements
            {hasNewAchievements && <span className={styles.navDot} aria-hidden="true" />}
          </NavLink>
          <NavLink to="/battle"      className={({ isActive }) => [styles.navLink, isActive ? styles.active : ''].join(' ')}>
            Battle <span className={styles.p2badge}>P2</span>
          </NavLink>
          <NavLink to="/raid"        className={({ isActive }) => [styles.navLink, isActive ? styles.active : ''].join(' ')}>
            Raid <span className={styles.p2badge}>P2</span>
          </NavLink>
          {!isGuest && (
            <NavLink to="/market" className={({ isActive }) => [styles.navLink, isActive ? styles.active : ''].join(' ')}>Market</NavLink>
          )}
          <NavLink to="/leaderboard" className={({ isActive }) => [styles.navLink, isActive ? styles.active : ''].join(' ')}>
            Ranks <span className={styles.p2badge}>P2</span>
          </NavLink>
        </nav>

        <div className={styles.headerRight} />
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
