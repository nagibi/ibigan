import { useIsMobile } from '@/hooks/use-mobile';
import { EquipamentosListPage } from '@/pages/equipamentos/equipamentos-list-page';
import { EquipamentosEstoqueGridView } from '@/pages/equipamentos/equipamentos-estoque-grid-view';

export function EquipamentosEstoquePage() {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return <EquipamentosEstoqueGridView />;
  }

  return (
    <EquipamentosListPage
      mode="estoque"
      title="Estoque"
      description="Equipamentos disponíveis para empréstimo"
    />
  );
}
