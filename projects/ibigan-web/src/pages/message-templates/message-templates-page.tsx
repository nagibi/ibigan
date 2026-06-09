import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Copy,
  FileText,
  LoaderCircle,
  Pencil,
  Plus,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  messageTemplatesService,
  type MessageChannel,
  type MessageTemplate,
} from '@/services/message-templates.service';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const CHANNEL_OPTIONS: { value: MessageChannel; label: string }[] = [
  { value: 'email', label: 'E-mail' },
  { value: 'sms', label: 'SMS' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'notification', label: 'Notificação' },
];

function resetSendState() {
  return {
    recipients: [] as string[],
    recipientInput: '',
    channels: ['email'] as MessageChannel[],
  };
}

export function MessageTemplatesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [sendTemplate, setSendTemplate] = useState<MessageTemplate | null>(null);
  const [sendRecipients, setSendRecipients] = useState<string[]>([]);
  const [recipientInput, setRecipientInput] = useState('');
  const [sendChannels, setSendChannels] = useState<MessageChannel[]>(['email']);

  const { data, isLoading } = useQuery({
    queryKey: ['message-templates', page],
    queryFn: () => messageTemplatesService.list(page),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => messageTemplatesService.destroy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] });
      toast.success('Template removido!');
      setDeleteId(null);
    },
    onError: () => toast.error('Erro ao remover template.'),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: number) => messageTemplatesService.duplicate(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] });
      toast.success('Template duplicado com sucesso!');
      navigate(`/message-templates/${res.data.result.id}/editar`);
    },
    onError: () => toast.error('Erro ao duplicar template.'),
  });

  const sendMutation = useMutation({
    mutationFn: () =>
      messageTemplatesService.send(sendTemplate!.id, {
        recipients: sendRecipients,
        channels: sendChannels,
      }),
    onSuccess: () => {
      toast.success('Mensagem enfileirada com sucesso!');
      closeSendDialog();
    },
    onError: () => toast.error('Erro ao enviar mensagem.'),
  });

  const templates = data?.data.result.data ?? [];
  const meta = data?.data.result.meta;

  function closeSendDialog() {
    setSendTemplate(null);
    const reset = resetSendState();
    setSendRecipients(reset.recipients);
    setRecipientInput(reset.recipientInput);
    setSendChannels(reset.channels);
  }

  function openSendDialog(template: MessageTemplate) {
    const reset = resetSendState();
    setSendTemplate(template);
    setSendRecipients(reset.recipients);
    setRecipientInput(reset.recipientInput);
    setSendChannels(reset.channels);
  }

  function addRecipient() {
    const value = recipientInput.trim();
    if (!value) return;
    if (!sendRecipients.includes(value)) {
      setSendRecipients((prev) => [...prev, value]);
    }
    setRecipientInput('');
  }

  function removeRecipient(recipient: string) {
    setSendRecipients((prev) => prev.filter((r) => r !== recipient));
  }

  function toggleChannel(channel: MessageChannel, checked: boolean) {
    setSendChannels((prev) =>
      checked ? [...prev, channel] : prev.filter((c) => c !== channel),
    );
  }

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Message Templates</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie templates de mensagens.
          </p>
        </div>
        <Button onClick={() => navigate('/message-templates/novo')}>
          <Plus className="size-4 mr-2" /> Novo Template
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Merge Tags</TableHead>
              <TableHead className="w-[120px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <LoaderCircle className="size-5 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : templates.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  <FileText className="size-8 mx-auto mb-2 opacity-30" />
                  Nenhum template cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              templates.map((t: MessageTemplate) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground font-mono">
                    {t.slug}
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.is_active ? 'primary' : 'secondary'}>
                      {t.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {t.merge_tags?.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-xs font-mono"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {(t.merge_tags?.length ?? 0) > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{(t.merge_tags?.length ?? 0) - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {t.is_active && (
                        <Button
                          variant="ghost"
                          mode="icon"
                          size="sm"
                          onClick={() => openSendDialog(t)}
                        >
                          <Send className="size-4 text-blue-500" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        mode="icon"
                        size="sm"
                        onClick={() => duplicateMutation.mutate(t.id)}
                        disabled={duplicateMutation.isPending}
                      >
                        <Copy className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        mode="icon"
                        size="sm"
                        onClick={() =>
                          navigate(`/message-templates/${t.id}/editar`)
                        }
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        mode="icon"
                        size="sm"
                        onClick={() => setDeleteId(t.id)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {meta && meta.last_page > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="flex items-center text-sm text-muted-foreground">
            Página {meta.current_page} de {meta.last_page}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === meta.last_page}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </Button>
        </div>
      )}

      <Dialog open={!!sendTemplate} onOpenChange={(open) => !open && closeSendDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar mensagem</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Template: <strong>{sendTemplate?.name}</strong>
            </p>

            <div className="space-y-2">
              <Label>Destinatários</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="email@exemplo.com ou +5511999999999"
                  value={recipientInput}
                  onChange={(e) => setRecipientInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addRecipient();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addRecipient}>
                  Adicionar
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 min-h-[32px]">
                {sendRecipients.map((recipient) => (
                  <Badge key={recipient} variant="secondary" className="gap-1">
                    {recipient}
                    <button type="button" onClick={() => removeRecipient(recipient)}>
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
                {sendRecipients.length === 0 && (
                  <span className="text-xs text-muted-foreground">
                    Nenhum destinatário adicionado.
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Canais</Label>
              <div className="grid grid-cols-2 gap-3">
                {CHANNEL_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 cursor-pointer text-sm"
                  >
                    <Checkbox
                      checked={sendChannels.includes(option.value)}
                      onCheckedChange={(checked) =>
                        toggleChannel(option.value, checked === true)
                      }
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => sendMutation.mutate()}
                disabled={
                  sendRecipients.length === 0
                  || sendChannels.length === 0
                  || sendMutation.isPending
                }
              >
                {sendMutation.isPending ? (
                  <>
                    <LoaderCircle className="size-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="size-4 mr-2" /> Enviar
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={closeSendDialog}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover template</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
