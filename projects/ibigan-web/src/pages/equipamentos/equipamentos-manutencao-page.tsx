import { useIsMobile } from '@/hooks/use-mobile';
import { EquipamentosListPage } from '@/pages/equipamentos/equipamentos-list-page';
import { EquipamentosModeGridView } from '@/pages/equipamentos/equipamentos-mode-grid-view';

export function EquipamentosManutencaoPage() {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return <EquipamentosModeGridView mode="manutencao" />;
  }

  return (
    <EquipamentosListPage
      mode="manutencao"
      title="Manutenção"
      description="Equipamentos em reparo ou revisão"
    />
  );
}
