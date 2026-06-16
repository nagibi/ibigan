import { useQuery } from '@tanstack/react-query';
import { equipamentosService } from '@/services/equipamentos.service';

export function useEquipamentoPotencialDevolucao(enabled = true) {
  return useQuery({
    queryKey: ['equipamentos-dashboard', 'potencial-devolucao'],
    queryFn: () => equipamentosService.dashboardPotencialDevolucao(),
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
