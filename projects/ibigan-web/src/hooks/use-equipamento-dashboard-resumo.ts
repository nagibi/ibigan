import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { equipamentosService } from '@/services/equipamentos.service';

const RESUMO_STALE_MS = 60_000;

export function useEquipamentoDashboardResumo(enabled = true) {
  return useQuery({
    queryKey: ['equipamentos-dashboard', 'resumo'],
    queryFn: () => equipamentosService.dashboardResumo(),
    enabled,
    staleTime: RESUMO_STALE_MS,
    gcTime: RESUMO_STALE_MS * 5,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      const status = (error as AxiosError)?.response?.status;
      if (status === 429 || status === 401 || status === 403) {
        return false;
      }
      return failureCount < 1;
    },
  });
}
