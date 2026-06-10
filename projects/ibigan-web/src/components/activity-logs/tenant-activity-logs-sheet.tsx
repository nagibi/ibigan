import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, LoaderCircle } from 'lucide-react';
import { adminTenantsService } from '@/services/admin-tenants.service';
import { ActivityLogTimelineItem } from '@/components/activity-logs/activity-log-timeline-item';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface TenantActivityLogsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  tenantLabel: string;
}

export function TenantActivityLogsSheet({
  open,
  onOpenChange,
  tenantId,
  tenantLabel,
}: TenantActivityLogsSheetProps) {
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-tenant-activity-logs', tenantId],
    queryFn: () => adminTenantsService.activityLogs(tenantId),
    enabled: open,
    refetchInterval: open && autoRefresh ? 30000 : false,
  });

  const logs = data?.data.result.data ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="inset-5 start-auto h-auto w-full gap-0 rounded-lg p-0 sm:max-w-none sm:w-[520px] [&_[data-slot=sheet-close]]:end-5 [&_[data-slot=sheet-close]]:top-4.5">
        <SheetHeader className="mb-0 border-b px-5 py-4">
          <div className="flex items-start justify-between gap-3 pe-8">
            <div className="min-w-0">
              <SheetTitle className="flex items-center gap-2 p-0">
                <Activity className="size-4 shrink-0" />
                Activity
              </SheetTitle>
              <p className="mt-1 truncate text-sm text-muted-foreground">{tenantLabel}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Label htmlFor="tenant-activity-auto-refresh" className="text-xs text-muted-foreground">
                Auto refresh: {autoRefresh ? 'On' : 'Off'}
              </Label>
              <Switch
                id="tenant-activity-auto-refresh"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
            </div>
          </div>
        </SheetHeader>

        <SheetBody className="grow p-0">
          <ScrollArea className="h-[calc(100vh-11rem)]">
            <div className="px-5 py-5">
              {isLoading ? (
                <div className="flex justify-center py-16">
                  <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Activity className="mb-2 size-10 opacity-30" />
                  <p className="text-sm">Nenhuma atividade registrada.</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {logs.map((log, index) => (
                    <ActivityLogTimelineItem
                      key={log.id}
                      log={log}
                      line={index < logs.length - 1}
                      subjectName={tenantLabel}
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </SheetBody>

        <SheetFooter className="grid grid-cols-2 gap-2.5 border-t border-border p-5">
          <Button variant="outline" onClick={() => void refetch()} disabled={isFetching}>
            {isFetching ? 'Atualizando...' : 'Atualizar'}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
