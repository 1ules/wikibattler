import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import type { PaginatedResponse, UserCard, ApiResponse } from '@wikibattler/shared';

export function useCollection(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['cards', page, pageSize],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PaginatedResponse<UserCard>>>(
        `/cards?page=${page}&pageSize=${pageSize}`
      );
      return data.data;
    },
  });
}
