import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, LoaderCircle, RefreshCw, Shield, ShieldCheck, ShieldOff } from 'lucide-react';
import { twoFactorService } from '@/services/two-factor.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const confirmSchema = z.object({
  code: z.string().min(6, 'Código inválido.').max(10),
});

const disableSchema = z.object({
  password: z.string().min(1, 'Senha é obrigatória.'),
});

type ConfirmFormData = z.infer<typeof confirmSchema>;
type DisableFormData = z.infer<typeof disableSchema>;

type Step = 'idle' | 'setup' | 'confirm' | 'enabled';

export function SecurityContent() {
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>('idle');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [setupCodes, setSetupCodes] = useState<string[]>([]);
  const [showDisableDialog, setShowDisableDialog] = useState(false);

  const { data: twoFactorStatus } = useQuery({
    queryKey: ['two-factor-status'],
    queryFn: async () => {
      try {
        const res = await twoFactorService.recoveryCodes();
        return {
          enabled: true,
          recovery_codes: res.data.result.recovery_codes,
        };
      } catch {
        return { enabled: false, recovery_codes: [] as string[] };
      }
    },
  });

  const is2FAEnabled = twoFactorStatus?.enabled ?? false;

  const confirmForm = useForm<ConfirmFormData>({
    resolver: zodResolver(confirmSchema),
    defaultValues: { code: '' },
  });

  const disableForm = useForm<DisableFormData>({
    resolver: zodResolver(disableSchema),
    defaultValues: { password: '' },
  });

  const enableMutation = useMutation({
    mutationFn: () => twoFactorService.enable(),
    onSuccess: (res) => {
      setQrCodeUrl(res.data.result.qr_code_url);
      setSecret(res.data.result.secret);
      setSetupCodes(res.data.result.recovery_codes);
      setStep('setup');
    },
    onError: () => toast.error('Erro ao habilitar 2FA.'),
  });

  const confirmMutation = useMutation({
    mutationFn: (data: ConfirmFormData) => twoFactorService.confirm(data.code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['two-factor-status'] });
      setStep('enabled');
      toast.success('2FA habilitado com sucesso!');
    },
    onError: () => {
      confirmForm.setError('code', { message: 'Código inválido. Tente novamente.' });
    },
  });

  const disableMutation = useMutation({
    mutationFn: (data: DisableFormData) => twoFactorService.disable(data.password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['two-factor-status'] });
      setStep('idle');
      setShowDisableDialog(false);
      disableForm.reset();
      toast.success('2FA desabilitado.');
    },
    onError: () => {
      disableForm.setError('password', { message: 'Senha incorreta.' });
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: () => twoFactorService.regenerateRecoveryCodes(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['two-factor-status'] });
      toast.success('Códigos de recuperação regenerados!');
    },
    onError: () => toast.error('Erro ao regenerar códigos.'),
  });

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  }

  const recoveryCodes = step === 'setup'
    ? setupCodes
    : twoFactorStatus?.recovery_codes ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {is2FAEnabled || step === 'enabled'
                ? <ShieldCheck className="size-6 shrink-0 text-green-600" />
                : <Shield className="size-6 shrink-0 text-muted-foreground" />
              }
              <div className="min-w-0">
                <CardTitle>Autenticação em duas etapas (2FA)</CardTitle>
                <CardDescription>
                  Proteja sua conta com um segundo fator de autenticação via aplicativo.
                </CardDescription>
              </div>
            </div>
            <Badge variant={is2FAEnabled || step === 'enabled' ? 'default' : 'secondary'}>
              {is2FAEnabled || step === 'enabled' ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {step === 'idle' && !is2FAEnabled && (
            <Button onClick={() => enableMutation.mutate()} disabled={enableMutation.isPending}>
              {enableMutation.isPending
                ? <><LoaderCircle className="size-4 mr-2 animate-spin" /> Configurando...</>
                : <><Shield className="size-4 mr-2" /> Habilitar 2FA</>
              }
            </Button>
          )}

          {step === 'setup' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Escaneie o QR code abaixo com seu aplicativo autenticador (Google Authenticator, Authy, etc).
              </p>
              <div className="flex flex-col items-center gap-4 rounded-lg border bg-muted/30 p-4">
                <QRCodeSVG value={qrCodeUrl} size={192} />
                <div className="flex items-center gap-2 text-sm">
                  <code className="rounded bg-muted px-2 py-1 font-mono text-xs">{secret}</code>
                  <Button variant="ghost" mode="icon" size="sm" onClick={() => copyToClipboard(secret)}>
                    <Copy className="size-3" />
                  </Button>
                </div>
              </div>

              <Form {...confirmForm}>
                <form onSubmit={confirmForm.handleSubmit((data) => confirmMutation.mutate(data))} className="space-y-3">
                  <FormField control={confirmForm.control} name="code" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código de verificação</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="000000"
                          maxLength={10}
                          className="max-w-[200px] text-center tracking-widest"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="flex gap-2">
                    <Button type="submit" disabled={confirmMutation.isPending}>
                      {confirmMutation.isPending
                        ? <><LoaderCircle className="size-4 mr-2 animate-spin" /> Verificando...</>
                        : 'Confirmar e ativar'
                      }
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setStep('idle')}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}

          {(step === 'enabled' || is2FAEnabled) && step !== 'setup' && (
            <Button
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive/10"
              onClick={() => setShowDisableDialog(true)}
            >
              <ShieldOff className="size-4 mr-2" /> Desabilitar 2FA
            </Button>
          )}
        </CardContent>
      </Card>

      {(step === 'setup' || step === 'enabled' || is2FAEnabled) && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Códigos de recuperação</CardTitle>
                <CardDescription>
                  Use estes códigos caso perca acesso ao seu aplicativo autenticador.
                  Guarde-os em local seguro.
                </CardDescription>
              </div>
              {(step === 'enabled' || is2FAEnabled) && step !== 'setup' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => regenerateMutation.mutate()}
                  disabled={regenerateMutation.isPending}
                >
                  {regenerateMutation.isPending
                    ? <LoaderCircle className="size-4 animate-spin" />
                    : <RefreshCw className="size-4 mr-2" />
                  }
                  Regenerar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {recoveryCodes.map((code, index) => (
                <div key={index} className="flex items-center justify-between rounded bg-muted px-3 py-2">
                  <code className="font-mono text-sm">{code}</code>
                  <Button variant="ghost" mode="icon" size="sm" onClick={() => copyToClipboard(code)}>
                    <Copy className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desabilitar autenticação em duas etapas</AlertDialogTitle>
            <AlertDialogDescription>
              Confirme sua senha para desabilitar o 2FA. Sua conta ficará menos protegida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Form {...disableForm}>
            <form onSubmit={disableForm.handleSubmit((data) => disableMutation.mutate(data))} className="space-y-3 px-6 pb-2">
              <FormField control={disableForm.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha atual</FormLabel>
                  <FormControl><Input type="password" placeholder="Sua senha" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </form>
          </Form>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={disableForm.handleSubmit((data) => disableMutation.mutate(data))}
              disabled={disableMutation.isPending}
            >
              {disableMutation.isPending
                ? <LoaderCircle className="size-4 animate-spin" />
                : 'Desabilitar'
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
