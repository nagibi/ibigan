import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { useEquipamentoUrlSearch } from '@/hooks/use-equipamento-url-search';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { equipamentosService } from '@/services/equipamentos.service';
import type { Equipamento } from '@/types/equipamento';
import { HistoricoModal } from '@/pages/equipamentos/components/equipamento-modals';
import { EquipamentoSearchField } from '@/pages/equipamentos/components/equipamento-search-field';
import { EquipamentoThumbnail } from '@/pages/equipamentos/components/equipamento-thumbnail';

export function EquipamentosHistoricoPage() {
  const { search, setSearch, qParam } = useEquipamentoUrlSearch();
  const [selected, setSelected] = useState<Equipamento | null>(null);

  usePageToolbar({
    title: 'Histórico',
    description: 'Consulte o histórico de movimentações por patrimônio',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['equipamentos', 'historico-search', qParam],
    queryFn: () => equipamentosService.list({ search: qParam, per_page: 10 }),
    enabled: qParam.length >= 2,
  });

  const items = data?.data ?? [];

  return (
    <div>
      <EquipamentoSearchField value={search} onChange={setSearch} className="mt-1" />

      <div className="mt-4">
        {qParam.length < 2 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Digite ao menos 2 caracteres para buscar um equipamento e ver o histórico.
          </p>
        ) : isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Nenhum equipamento encontrado.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {items.map((equipamento) => (
              <li
                key={equipamento.id}
                className="flex items-center gap-3 px-4 py-3 text-sm"
              >
                <EquipamentoThumbnail equipamento={equipamento} size="sm" previewEnabled />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{equipamento.patrimonio}</p>
                  <p className="truncate text-muted-foreground">{equipamento.tipo?.nome}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setSelected(equipamento)}>
                  Ver histórico
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <HistoricoModal
        equipamento={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}
