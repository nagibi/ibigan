import { useEffect, useMemo, useState } from 'react';
import { FlaskConical } from 'lucide-react';
import type { MessageChannel, MessageTemplate } from '@/services/message-templates.service';
import {
  buildDefaultTemplateTagValues,
  extractTemplateTags,
} from '@/lib/message-template-tags';
import { useAuthStore } from '@/stores/auth.store';
import { useCentralAuthStore } from '@/stores/central-auth.store';
import { DialogPanelTitle } from '@/components/common/panel-title';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
} from '@/components/ui/dialog';

export interface TemplateTestSendPayload {
  merge_data: Record<string, string>;
  channels?: MessageChannel[];
}

interface TemplateTestSendDialogProps {
  template: MessageTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPlatformCatalog: boolean;
  onSubmit: (payload: TemplateTestSendPayload) => Promise<void>;
  isSubmitting: boolean;
}

const TENANT_CHANNELS: Array<{ value: MessageChannel; label: string }> = [
  { value: 'email', label: 'E-mail' },
  { value: 'notification', label: 'Notificação' },
];

export function TemplateTestSendDialog({
  template,
  open,
  onOpenChange,
  isPlatformCatalog,
  onSubmit,
  isSubmitting,
}: TemplateTestSendDialogProps) {
  const tenantUser = useAuthStore((state) => state.user);
  const centralUser = useCentralAuthStore((state) => state.centralUser);
  const currentUser = isPlatformCatalog ? centralUser : tenantUser;

  const tags = useMemo(
    () => (template ? extractTemplateTags(template) : []),
    [template],
  );

  const [tagValues, setTagValues] = useState<Record<string, string>>({});
  const [channels, setChannels] = useState<MessageChannel[]>(['email', 'notification']);

  useEffect(() => {
    if (!open || !template || !currentUser) return;

    setTagValues(buildDefaultTemplateTagValues(tags, currentUser));
    setChannels(isPlatformCatalog ? ['email'] : ['email', 'notification']);
  }, [currentUser, isPlatformCatalog, open, tags, template]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!template) return;

    await onSubmit({
      merge_data: tagValues,
      channels: isPlatformCatalog ? ['email'] : channels,
    });
  }

  function updateTagValue(tag: string, value: string) {
    setTagValues((current) => ({ ...current, [tag]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogPanelTitle icon={FlaskConical}>Testar template</DialogPanelTitle>
          <DialogDescription>
            {template
              ? `Preencha os valores das tags de "${template.name}" antes de enviar para ${currentUser?.email ?? 'seu usuário'}.`
              : 'Preencha os valores das tags antes de enviar o teste.'}
          </DialogDescription>
        </DialogHeader>

        {template ? (
          <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
            {tags.length > 0 ? (
              <div className="max-h-[320px] space-y-3 overflow-y-auto pr-1">
                {tags.map((tag) => (
                  <div key={tag} className="space-y-1.5">
                    <Label htmlFor={`template-tag-${tag}`} className="font-mono text-xs">
                      {`{{${tag}}}`}
                    </Label>
                    <Input
                      id={`template-tag-${tag}`}
                      value={tagValues[tag] ?? ''}
                      onChange={(event) => updateTagValue(tag, event.target.value)}
                      placeholder={`Valor para ${tag}`}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Este template não possui tags para preencher.
              </p>
            )}

            {!isPlatformCatalog ? (
              <div className="space-y-2">
                <Label>Canais</Label>
                <div className="flex flex-wrap gap-4">
                  {TENANT_CHANNELS.map((channel) => (
                    <label key={channel.value} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={channels.includes(channel.value)}
                        onCheckedChange={(checked) => {
                          setChannels((current) => {
                            if (checked) {
                              return current.includes(channel.value)
                                ? current
                                : [...current, channel.value];
                            }

                            return current.filter((item) => item !== channel.value);
                          });
                        }}
                      />
                      {channel.label}
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || (!isPlatformCatalog && channels.length === 0)}
              >
                {isSubmitting ? 'Enviando...' : 'Enviar teste'}
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
