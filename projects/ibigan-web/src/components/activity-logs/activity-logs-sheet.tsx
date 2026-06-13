import { useQuery } from '@tanstack/react-query';
import { History, LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { activityLogsService } from '@/services/activity-logs.service';
import { ActivityLogTimelineItem } from '@/components/activity-logs/activity-log-timeline-item';
import { Button } from '@/components/ui/button';
import {
  SidePanelSheet,
  SidePanelSheetActions,
  SidePanelSheetBody,
  SidePanelSheetContent,
  SidePanelSheetFooter,
  SidePanelSheetHeader,
} from '@/components/ui/side-panel-sheet';
import { SheetTitle } from '@/components/ui/sheet';

interface ActivityLogsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectType: string;
  subjectId: number;
  subjectLabel: string;
}

export function ActivityLogsSheet({
  open,
  onOpenChange,
  subjectType,
  subjectId,
  subjectLabel,
}: ActivityLogsSheetProps) {
  const { t } = useTranslation();

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['activity-logs', subjectType, subjectId],
    queryFn: () => activityLogsService.forSubject(subjectType, subjectId),
    enabled: open,
  });

  const logs = data?.data.result.data ?? [];

  return (
    <SidePanelSheet open={open} onOpenChange={onOpenChange}>
      <SidePanelSheetContent width={520}>
        <SidePanelSheetHeader className="border-b px-5 py-4">
          <SheetTitle className="flex items-center gap-2 pe-8 p-0">
            <History className="size-4 shrink-0" />
            {t('form.activity_log')}
          </SheetTitle>
        </SidePanelSheetHeader>

        <SidePanelSheetBody>
          {isLoading ? (
            <div className="flex justify-center py-16">
              <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <History className="mb-2 size-10 opacity-30" />
              <p className="text-sm">Nenhuma atividade registrada.</p>
            </div>
          ) : (
            <div className="flex flex-col pb-2">
              {logs.map((log, index) => (
                <ActivityLogTimelineItem
                  key={log.id}
                  log={log}
                  line={index < logs.length - 1}
                  subjectName={subjectLabel}
                />
              ))}
            </div>
          )}
        </SidePanelSheetBody>

        <SidePanelSheetFooter>
          <SidePanelSheetActions>
            <Button variant="outline" onClick={() => void refetch()} disabled={isFetching}>
              {isFetching ? 'Atualizando...' : 'Atualizar'}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
          </SidePanelSheetActions>
        </SidePanelSheetFooter>
      </SidePanelSheetContent>
    </SidePanelSheet>
  );
}
