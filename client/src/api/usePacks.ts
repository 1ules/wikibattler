import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { usePackStore } from '../stores/packStore.js';
import type { PackState, PackOpenResult, UserCard, ApiResponse } from '@wikibattler/shared';
import { useEffect } from 'react';

// ─── Pack state ───────────────────────────────────────────────────────────────

export function usePackState() {
  const setPackState = usePackStore((s) => s.setPackState);

  const query = useQuery({
    queryKey: ['packs', 'state'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PackState>>('/packs/state');
      return data.data;
    },
    refetchInterval: 65_000,
  });

  useEffect(() => {
    if (query.data) {
      setPackState(query.data);
    }
  }, [query.data, setPackState]);

  return query;
}

// ─── Open regular pack ────────────────────────────────────────────────────────

export function useOpenPack() {
  const qc = useQueryClient();
  const setPackState = usePackStore((s) => s.setPackState);

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<PackOpenResult & { pitySrGained: number; pityUrGained: number }>>('/packs/open');
      return data.data;
    },
    onSuccess: (result) => {
      setPackState(result.packState);
      qc.invalidateQueries({ queryKey: ['cards'] });
    },
  });
}

// ─── Open pity pack ───────────────────────────────────────────────────────────

interface PityOpenResult {
  card: UserCard;
  packState: PackState;
}

export function useOpenPityPack() {
  const qc = useQueryClient();
  const setPackState = usePackStore((s) => s.setPackState);

  return useMutation({
    mutationFn: async (tier: 'SR' | 'UR') => {
      const { data } = await api.post<ApiResponse<PityOpenResult>>('/packs/open-pity', { tier });
      return data.data;
    },
    onSuccess: (result) => {
      setPackState(result.packState);
      qc.invalidateQueries({ queryKey: ['cards'] });
    },
  });
}
