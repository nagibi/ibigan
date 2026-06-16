import { EquipamentosListPage } from '@/pages/equipamentos/equipamentos-list-page';

export function EquipamentosUtilizacaoPage() {
  return (
    <EquipamentosListPage
      mode="utilizacao"
      title="Em uso"
      description="Equipamentos emprestados e em campo"
    />
  );
}
