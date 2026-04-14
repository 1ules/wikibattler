import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/queryClient.js';
import { AppShell } from './components/Layout/AppShell.js';
import { Home } from './pages/Home/Home.js';
import { Collection } from './pages/Collection/Collection.js';
import { Battle } from './pages/Battle/Battle.js';
import { Marketplace } from './pages/Marketplace/Marketplace.js';
import { Leaderboard } from './pages/Leaderboard/Leaderboard.js';
import { Profile } from './pages/Profile/Profile.js';
import { ROUTES } from './lib/router.js';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path={ROUTES.HOME}        element={<Home />} />
            <Route path={ROUTES.COLLECTION}  element={<Collection />} />
            <Route path={ROUTES.BATTLE}      element={<Battle />} />
            <Route path={ROUTES.MARKETPLACE} element={<Marketplace />} />
            <Route path={ROUTES.LEADERBOARD} element={<Leaderboard />} />
            <Route path={ROUTES.PROFILE}     element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
