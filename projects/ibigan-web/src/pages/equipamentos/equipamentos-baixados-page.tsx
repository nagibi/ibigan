import { EquipamentosListPage } from '@/pages/equipamentos/equipamentos-list-page';

export function EquipamentosBaixadosPage() {
  return (
    <EquipamentosListPage
      mode="baixados"
      title="Baixados"
      description="Equipamentos devolvidos ao fornecedor ou dados como perdidos"
    />
  );
}
