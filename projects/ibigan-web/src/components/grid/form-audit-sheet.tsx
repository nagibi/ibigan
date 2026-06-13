import { ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  SidePanelSheet,
  SidePanelSheetBody,
  SidePanelSheetContent,
  SidePanelSheetFooter,
  SidePanelSheetHeader,
} from '@/components/ui/side-panel-sheet';
import { SheetTitle } from '@/components/ui/sheet';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface FormAuditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityLabel?: string;
  createdBy?: string | null;
  createdAt?: string | null;
  updatedBy?: string | null;
  updatedAt?: string | null;
}

function formatAuditDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return format(new Date(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return iso;
  }
}

function AuditField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}

export function FormAuditSheet({
  open,
  onOpenChange,
  entityLabel,
  createdBy,
  createdAt,
  updatedBy,
  updatedAt,
}: FormAuditSheetProps) {
  return (
    <SidePanelSheet open={open} onOpenChange={onOpenChange}>
      <SidePanelSheetContent width={420}>
        <SidePanelSheetHeader className="border-b px-5 py-4">
          <SheetTitle className="flex items-center gap-2 p-0">
            <ClipboardList className="size-4 shrink-0" />
            Auditoria
          </SheetTitle>
          {entityLabel && (
            <p className="mt-1 truncate text-sm text-muted-foreground">{entityLabel}</p>
          )}
        </SidePanelSheetHeader>

        <SidePanelSheetBody>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Informações do registro</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <AuditField label="Data de criação" value={formatAuditDate(createdAt)} />
              <AuditField label="Usuário de criação" value={createdBy ?? '—'} />
              <AuditField label="Data de atualização" value={formatAuditDate(updatedAt)} />
              <AuditField label="Usuário de atualização" value={updatedBy ?? '—'} />
            </CardContent>
          </Card>
        </SidePanelSheetBody>

        <SidePanelSheetFooter>
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </SidePanelSheetFooter>
      </SidePanelSheetContent>
    </SidePanelSheet>
  );
}
