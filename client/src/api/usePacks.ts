import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { usePackStore } from '../stores/packStore.js';
import type { PackState, PackOpenResult, ApiResponse } from '@wikibattler/shared';
import { useEffect } from 'react';

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
      setPackState(query.data.storedPacks, query.data.nextPackAt);
    }
  }, [query.data, setPackState]);

  return query;
}

export function useOpenPack() {
  const qc = useQueryClient();
  const setPackState = usePackStore((s) => s.setPackState);

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<PackOpenResult>>('/packs/open');
      return data.data;
    },
    onSuccess: (result) => {
      setPackState(result.packState.storedPacks, result.packState.nextPackAt);
      qc.invalidateQueries({ queryKey: ['cards'] });
    },
  });
}
