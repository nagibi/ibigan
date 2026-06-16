import { useApiMenuByPath } from '@/hooks/use-api-menu-by-path';

export function useEquipcontrolAlertasEnabled() {
  return Boolean(useApiMenuByPath('/equipamentos'));
}
