import { useQuery } from '@tanstack/react-query';
import { equipamentosService } from '@/services/equipamentos.service';

export function useEquipamentoCentralAlertas(enabled = true) {
  return useQuery({
    queryKey: ['equipamentos-dashboard', 'alertas'],
    queryFn: () => equipamentosService.dashboardAlertas(),
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}
