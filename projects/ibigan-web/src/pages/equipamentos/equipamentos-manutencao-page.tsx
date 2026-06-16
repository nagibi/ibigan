import { EquipamentosListPage } from '@/pages/equipamentos/equipamentos-list-page';

export function EquipamentosManutencaoPage() {
  return (
    <EquipamentosListPage
      mode="manutencao"
      title="Manutenção"
      description="Equipamentos em reparo ou revisão"
    />
  );
}
