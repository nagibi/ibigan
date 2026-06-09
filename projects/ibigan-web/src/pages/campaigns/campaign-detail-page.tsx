import { useState } from 'react';
import type { ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, Clock, LoaderCircle, Mail, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { campaignsService } from '@/services/campaigns.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const statusIcon: Record<string, ReactNode> = {
  queued: <Clock className="size-4 text-muted-foreground" />,
  sent: <Mail className="size-4 text-blue-500" />,
  delivered: <CheckCircle className="size-4 text-green-500" />,
  failed: <XCircle className="size-4 text-destructive" />,
  opened: <CheckCircle className="size-4 text-green-600" />,
};

export function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data: campaignData, isLoading: loadingCampaign } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaignsService.show(Number(id)),
    refetchInterval: 5000,
  });

  const { data: deliveriesData, isLoading: loadingDeliveries } = useQuery({
    queryKey: ['campaign-deliveries', id, page],
    queryFn: () => campaignsService.deliveries(Number(id), page),
  });

  const campaign = campaignData?.data.result;
  const deliveries = deliveriesData?.data.result.data ?? [];
  const meta = deliveriesData?.data.result.meta;

  if (loadingCampaign) {
    return (
      <div className="container py-6 flex justify-center">
        <LoaderCircle className="size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" mode="icon" size="sm" onClick={() => navigate('/campaigns')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{campaign?.name}</h1>
            <Badge variant={campaign?.status === 'sent' ? 'primary' : 'secondary'}>
              {campaign?.status}
            </Badge>
          </div>
          {campaign?.description && (
            <p className="text-sm text-muted-foreground">{campaign.description}</p>
          )}
        </div>
      </div>

      {campaign?.stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: campaign.stats.total, color: 'text-foreground' },
            { label: 'Enviados', value: campaign.stats.sent, color: 'text-blue-600' },
            { label: 'Falhas', value: campaign.stats.failed, color: 'text-destructive' },
            { label: 'Abertos', value: campaign.stats.opened, color: 'text-green-600' },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="mb-6">
        <CardHeader><CardTitle>Detalhes</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Canais</p>
              <div className="flex gap-1 mt-1">
                {campaign?.channels.map((ch) => (
                  <Badge key={ch} variant="outline">{ch}</Badge>
                ))}
              </div>
            </div>
            {campaign?.started_at && (
              <div>
                <p className="text-muted-foreground">Iniciado em</p>
                <p>{format(new Date(campaign.started_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
              </div>
            )}
            {campaign?.finished_at && (
              <div>
                <p className="text-muted-foreground">Finalizado em</p>
                <p>{format(new Date(campaign.finished_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Histórico de entregas</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Destinatário</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enviado em</TableHead>
                <TableHead>Aberto em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingDeliveries ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <LoaderCircle className="size-5 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : deliveries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhuma entrega registrada ainda.
                  </TableCell>
                </TableRow>
              ) : (
                deliveries.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="text-sm">{d.recipient_email ?? `User #${d.user_id}`}</TableCell>
                    <TableCell><Badge variant="outline">{d.channel}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {statusIcon[d.status]}
                        <span className="text-sm">{d.status}</span>
                      </div>
                      {d.error_message && (
                        <p className="text-xs text-destructive mt-0.5">{d.error_message}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {d.sent_at ? format(new Date(d.sent_at), "dd/MM 'às' HH:mm", { locale: ptBR }) : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {d.opened_at ? format(new Date(d.opened_at), "dd/MM 'às' HH:mm", { locale: ptBR }) : '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {meta && meta.last_page > 1 && (
            <div className="flex justify-center gap-2 p-4">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
              <span className="flex items-center text-sm text-muted-foreground">Página {meta.current_page} de {meta.last_page}</span>
              <Button variant="outline" size="sm" disabled={page === meta.last_page} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
