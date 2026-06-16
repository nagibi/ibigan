import { EquipamentosListPage } from '@/pages/equipamentos/equipamentos-list-page';

export function EquipamentosMovimentacoesPage() {
  return (
    <EquipamentosListPage
      mode="utilizacao"
      title="Movimentações"
      description="Equipamentos em uso e devoluções"
    />
  );
}
