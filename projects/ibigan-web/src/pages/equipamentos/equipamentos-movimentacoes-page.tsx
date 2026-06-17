import { useIsMobile } from '@/hooks/use-mobile';
import { EquipamentosListPage } from '@/pages/equipamentos/equipamentos-list-page';
import { EquipamentosModeGridView } from '@/pages/equipamentos/equipamentos-mode-grid-view';

export function EquipamentosMovimentacoesPage() {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return <EquipamentosModeGridView mode="utilizacao" />;
  }

  return (
    <EquipamentosListPage
      mode="utilizacao"
      title="Movimentações"
      description="Equipamentos em uso e devoluções"
    />
  );
}
